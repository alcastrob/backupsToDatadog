const backupPinger = require('.'); /* the current working directory so that means main.js because of package.json */
const { extendWith } = require('lodash');
const regexDestDir = /--(destDir|destdir)=(?<dir>.*)/gm;
const regexId = /--(id|Id|ID)=(?<id>.*)/gm;
const regexVersion = /--version/gm;
var configValues = {};

console.log(
  `Backup Pinger v${
    require('./package.json').version
  }. Notifica la ejecución de una copia de seguridad e informa de los resultados a un repositorio centralizado.`
);

for (var counter = 2; counter !== process.argv.length; counter++) {
  var resultDestDir = regexDestDir.exec(process.argv[counter]);
  if (resultDestDir) {
    configValues.destDir = resultDestDir.groups['dir'];
    continue;
  }
  var resultId = regexId.exec(process.argv[counter]);
  if (resultId) {
    configValues.id = resultId.groups['id'];
    continue;
  }
  var requestVersion = regexVersion.exec(process.argv[counter]);
  if (requestVersion) {
    configValues.version = true;
    continue;
  }
}

if (configValues.version) {
  console.log(`Version ${require('./package.json').version}`);
  return;
}

if (!configValues.destDir || !configValues.id) {
  console.error('Error. Faltan parámetros');
} else {
  backupPinger(configValues.destDir, configValues.id);
}
