# Application Insights StatsD backend

[![NPM version](https://badge.fury.io/js/appinsights-statsd.svg)](http://badge.fury.io/js/appinsights-statsd)
[![Build Status](https://travis-ci.org/Microsoft/ApplicationInsights-statsd.svg?branch=master)](https://travis-ci.org/Microsoft/ApplicationInsights-statsd)

The ApplicationInsights StatsD backend enables easy pre-aggregation of lightweight [StatsD](https://github.com/etsy/statsd) metrics that can be then forwarded to Application Insights.

## Installation and Configuration

You can add the appinsights backend into your existing StatsD project or into a new clone of the official StatsD repo.

### New Project

Install `node.js` from [nodejs.org](https://nodejs.org)

Clone the statsd project:

    $ git clone https://github.com/etsy/statsd
    
Create a config file from exampleConfig.js:

    $ cd /path/to/statsd
    $ cp exampleConfig.js appinsights.js
    
Continue with the Existing Project instructions 
    
### Existing project

Install the `appinsights-statsd` backend npm module:

    $ cd /path/to/statsd
    $ npm install appinsights-statsd --save

Add the backend and configuration to your statsd config file (`appinsights.js`):

```js
{
    backends: [ "appinsights-statsd" ],  // [Required] The Application Insighst StatsD backend
    aiInstrumentationKey: "<Application Insights Instrumentation Key from https://portal.azure.com>",  // [Required] Your instrumentation key
    aiPrefix: "myapp",  // [Optional] Send only metrics with this prefix
    aiRoleName: "MyFrontEnd",  // [Optional] Add this role name context tag to every metric
    aiRoleInstance: "VM5",  // [Optional] Add this role instance context tag to every metric
    aiTrackStatsDMetrics: true,  // [Optional] Send StatsD internal metrics to Application Insights
}
```

Start the Daemon:  

    $ node stats.js /path/to/config
    
## Usage

The backend supports counters, timers and gauges with the standard statsd format.

In additional, custom properties can be attached to each metric using a double-underscore delimiter in this format:

```
"<name>__<base64-encoded JSON>"
```

E.g. to send a counter with a custom property you could use code like this:

```js
const customProperties = { "title": "engineer" };
const customPropertiesEncoded = new Buffer(JSON.stringify(customProperties)).toString("base64");
const name = "jobs-open__" + customPropertiesEncoded;
statsDClient.increment(name);
```
   
## Contributing

See [CONTRIBUTING](CONTRIBUTING.md) for details