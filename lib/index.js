const util = require('util');
const uuid = require('node-uuid');
const winston = require('winston');
const couchbase = require('couchbase');

const Couchbase = winston.transports.Couchbase = function (userOptions={}) {
	const options = Object.assign({
		level: 'info',
		silent: false,
		host: 'localhost:8091',
		bucket: 'default',
		password: null,
		prefix: 'wl::',
	}, userOptions);

	winston.Transport.call(this, options);

	this.name = 'couchbase';
	this.level = options.level;
	this.silent = options.silent;
	this.host = options.host;
	this.bucket = options.bucket;
	this.password = options.password;
	this.prefix = options.prefix;

	const cluster = new couchbase.Cluster(this.host);
	this.$bucket = cluster.openBucket(this.bucket);
};

/**
 * @function log
 * @param {string} level
 * @param {string} message
 * @param {string} meta
 * @param {function} callback
 */
Couchbase.prototype.log = function (level, message, meta, callback) {
	process.nextTick(() => {
		if (this.silent) {
			return callback(null, true);
		}

		// Create the log document
		const doc = {
			message,
			timestamp: Date.now(),
			level,
			meta,
		};

		// Create a docId using the prefix and the uuid
		const docId = this.prefix + uuid.v4();

		this.$bucket.insert(docId, doc, (err) => {
			if (err) {
				this.emit('error', err);
				return callback(err);
			}

			this.emit('logged');
			callback(null, true);
		});
	});
};

util.inherits(Couchbase, winston.Transport);
exports.Couchbase = Couchbase;
module.exports = Couchbase;
