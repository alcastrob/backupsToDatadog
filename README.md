# Backup notifier

A little nodejs project to send notifications of my Cobian backup job results into Datadog

## Getting Started

The idea is to call it after every execution of the backups this job (it's a windows command line tool) that will collect data from the backup destination directory (number of complete/differential backups, time-window between the first complete backup and the last differential one, etc.)

The application generates both metrics and logs in Datadog, and requires NO datadog agent installed on the host.

### Prerequisites

You need Cobian backup installed in your system and an account in datadog for collecting the data and exposing the different dashboards.

For building the tool, you're going to need:

- [nodejs](https://nodejs.org/es/download/) (at least v10)
- [pkg](https://www.npmjs.com/package/pkg) (for compiling the exe file)

## What things you need to install the software and how to install them

Clone the sources in your favorite directory and execute the following commands:

```
npm i
pkg -t node12-win-x64 .
```

## Deployment

Due to the limitations of one of the modules used (diskusage, used to calcullate the remaing ammount of free disk in the destination), when you distribute this tool you need to deploy together the generated .exe file and the diskusage.node file.

### How to use it

Go to the backup job you want to monitor in Cobian. Go to the Events section, and add one Post-backup event ('Command line' type).

```
COMMANDLINE,"path\tool.exe --destDir=c:\destDir --id=Datadog_API_Key",false
```

You have to set your own values for the path and name of the tool, the backup destination and the API Key generated in your Datadog account.

## Built With

- [node 12.18.1](nodejs.org)

## Authors

- **Angel Castro** - _Initial work_ - [Angel Castro](https://github.com/alcastrob)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
