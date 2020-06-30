const fs = require('fs');
const _ = require('lodash');
const disk = require('diskusage');
const axios = require('axios').default;
const abbreviate = require('number-abbreviate');

module.exports = async function (filePath, apiKey) {
  try {
    var files = [];
    var completes = [];
    var differential = [];
    var directory = fs.readdirSync(filePath);
    for (var file of directory) {
      var fileName = filePath + '\\' + file;
      var fileSize = fs.statSync(fileName)['size'];
      files[fileName] = fileSize;

      const regex = /.* (?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2}) (?<hour>\d{2});(?<minute>\d{2});(?<second>\d{2}) \((?<type>(.*))\).*/gm;
      const result = regex.exec(fileName);
      if (result) {
        const ts = `${result.groups['year']}${result.groups['month']}${result.groups['day']}T${result.groups['hour']}${result.groups['minute']}${result.groups['second']}`;

        const payload = {
          timestamp: ts,
          size: fileSize,
          date: new Date(
            result.groups['year'],
            result.groups['month'],
            result.groups['day'],
            result.groups['hour'],
            result.groups['minute'],
            result.groups['second']
          ),
        };
        switch (result.groups['type']) {
          case 'Completo':
            completes.push(payload);
            break;
          case 'Diferencial':
            differential.push(payload);
            break;
          default:
            throw `Tipo desconocido: ${result.groups['type']}`;
        }
      }
    }

    const { free } = await disk.check(require('path').resolve(fileName).substring(0, 2));
    logData(completes, differential, free, apiKey);
  } catch (err) {
    console.log(err);
  }

  async function logData(completesArray, differentialsArray, freeSpace, apiKey) {
    const fc = _.head(_.sortBy(completes, ['timestamp']));
    const lc = _.last(_.sortBy(completes, ['timestamp']));
    const ld = _.last(_.sortBy(differential, ['timestamp']));

    // console.log('diff:', differential)
    sendMetric('backup.espacioLibre', freeSpace, 'gauge', apiKey);

    if (fc && ld && lc) {
      sendMetric(
        'backup.ventanaDias',
        (Math.max(ld.date.getTime(), lc.date.getTime()) - fc.date.getTime()) / (1000 * 60 * 60 * 24),
        'gauge',
        apiKey
      );
    } else {
      sendMetric('backup.ventanaDias', 0, 'gauge', apiKey);
    }
    sendMetric('backup.totalBackups', completesArray.length + differentialsArray.length, 'gauge', apiKey);
    sendMetric('backup.totalCompletos', completesArray.length, 'gauge', apiKey);
    sendMetric('backup.totalDiferenciales', differentialsArray.length, 'gauge', apiKey);

    if (fc) {
      sendLog(`Primero completo: ${fc.timestamp} ${fc.size} (${abbreviate(fc.size, 1, ['K', 'M', 'G', 'T'])})`, apiKey);
    }
    if (lc) {
      sendLog(`Último completo: ${lc.timestamp} ${lc.size} (${abbreviate(lc.size, 1, ['K', 'M', 'G', 'T'])})`, apiKey);
    }
    if (ld) {
      sendLog(
        `Último diferencial: ${ld.timestamp} ${ld.size} (${abbreviate(ld.size, 1, ['K', 'M', 'G', 'T'])})`,
        apiKey
      );
    }
  }

  async function sendMetric(name, value, type, apiKey) {
    try {
      const ts = Math.trunc(new Date().getTime() / 1000);
      const payload = `{"series": [{"host": "${require('os').hostname()}", "metric": "${name}", "points": [[${ts}, ${value}]], "type": "${type}" }] }`;

      const response = await axios
        .post(`https://api.datadoghq.eu/api/v1/series?api_key=${apiKey}`, payload)
        .catch((error) => {
          console.error(error);
          throw error;
        });
      if (response.status < 200 || response.status > 202) {
        throw 'Error en la llamada remota: ' + response.status;
      }
    } catch (err) {
      console.error('Surgió un problema en el envío de las métricas.', err);
    }
  }

  async function sendLog(message, apiKey) {
    try {
      const response = await axios
        .post(`https://http-intake.logs.datadoghq.eu/v1/input/${apiKey}`, {
          message: message,
          status: 'info',
          host: require('os').hostname(),
          system: 'orma-backups',
          version: require('./package.json').version,
        })
        .catch((error) => {
          console.error(error);
          throw error;
        });
    } catch (err) {
      console.error('Surgio un problema en el envío de las trazas.', err);
    }
  }
};
