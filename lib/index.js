/**
 * DEPENDENCIES
 * ----------------------------------------------------------------------
 */

const uuid = require('node-uuid');
const winston = require('winston');
const couchbase = require('couchbase');

/**
 * HELPER FUNCTIONS
 * ----------------------------------------------------------------------
 */

/**
 * Returns a Unix time reference for upsert expiry purposes
 * @function getDocumentExpiration
 * @param {number} expiresIn - The number of seconds until doc expiration
 * @returns {number} 0 || calculated Unix number
 */
function getDocumentExpiration (expiresIn) {
	if (expiresIn > 2592000) { // a month in seconds
		const now = new Date();
		// Add expiresIn (milliseconds)
		const expiryDate = new Date(now.setSeconds(now.getSeconds() + expiresIn));
		// Convert to seconds -> time/1000
		return Math.round(expiryDate.getTime() / 1000);
	}

	return expiresIn;
}

/**
 * COUCHBASE TRANSPORT
 * ----------------------------------------------------------------------
 */

class Couchbase extends winston.Transport {
	constructor (userOptions = {}) {
		super();

		// Set the options using the base options and the user options
		this.options = Object.assign({
			level: 'info',
			silent: false,
			host: 'localhost:8091',
			bucket: 'default',
			username: null,
			password: null,
			prefix: 'wl::',
			expiry: 0,
		}, userOptions);

		winston.Transport.call(this, this.options);
		this.name = 'couchbase';
		this.level = this.options.level;

		// Connect to the cluster
		const cluster = new couchbase.Cluster(`couchbase://${this.options.host}`);

		// Authenticate the cluster
		if (this.options.username && this.options.password) {
			cluster.authenticate(this.options.username, this.options.password);
		}

		// Open a connection to the bucket
		this.bucket = cluster.openBucket(this.options.bucket);
	}

	/**
	 * Logs a message to Couchbase
	 * @function log
	 * @param {string} level - Log level
	 * @param {string} message - Log message
	 * @param {string} meta - Log metadata
	 * @param {function} callback - Callback to run after the log has finished
	 */
	log (level, message, meta, callback) {
		process.nextTick(() => {
			if (this.options.silent) {
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
			const docId = this.options.prefix + uuid.v4();

			// Create the expiry options
			const options = { expiry: getDocumentExpiration(this.options.expiry) };

			// Insert the document into couchbase
			this.bucket.insert(docId, doc, options, err => {
				if (err) {
					this.emit('error', err);
					return callback(err);
				}

				this.emit('logged');
				callback(null, true);
			});
		});
	}
}

/**
 * EXPORTS
 * ----------------------------------------------------------------------
 */

winston.transports.Couchbase = Couchbase;
module.exports = Couchbase;
