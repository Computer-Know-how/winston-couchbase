# Winston Couchbase 2

[![NPM](https://nodei.co/npm/winston-couchbase-2.png?downloads=true)](https://nodei.co/npm/winston-couchbase-2)

A Couchbase transport for [winston][1].

## Installation

```bash
npm install winston
npm install winston-couchbase-2 --save
```

## Usage

```js
var winston = require('winston');
// exposes `winston.transports.Couchbase`
var winstonCb = require('winston-couchbase-2');
winston.add(winston.transports.Couchbase, options);
```

## Options

- level *(default: info)*: level of the message this transport should log.
- bucket *(default: default)*: bucket where to store logs.
- prefix *(default: wl::)*: prefix of your keys.
- host *(default: 127.0.0.1:8091)*: address of the couchbase server.
- expiry *(default: 0)*: when the log should expire (seconds)

[1]: https://github.com/flatiron/winston "Winston"
