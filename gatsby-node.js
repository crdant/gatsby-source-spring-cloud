const client = require("@crdant/cloud-config-client")
const crypto = require("crypto")
const objectPath = require("object-path");

exports.sourceNodes = async (
  { boundActionCreators: { createNode }, createNodeId },
  configOptions
) => {
  var options = {} ;
  var vcap_services = {} ;
  var vcap_appliation = {} ;

  // for PCF with a bound config server
  if ( process.env.VCAP_SERVICES ) {
    vcap_services = JSON.parse(process.env.VCAP_SERVICES) ;
    if ( ( vcap_services["p-config-server"] ) && ( vcap_services["p-config-server"][0] ) && ( vcap_services["p-config-server"][0].credentials ) ) {
      options.endpoint =  vcap_services["p-config-server"][0].credentials.uri ;
      options.client_id = vcap_services["p-config-server"][0].credentials.client_id ;
      options.client_secret = vcap_services["p-config-server"][0].credentials.client_secret ;
      options.access_token_uri = vcap_services["p-config-server"][0].credentials.access_token_uri ;
    }
  }

  if ( process.env.VCAP_APPLICATION ) {
    vcap_application = JSON.parse(process.env.VCAP_APPLICATION) ;
    options.application = process.env.VCAP_APPLICATION && process.env.VCAP_APPLICATION.application_name ;
  }

  options.endpoint = options.endpoint || configOptions.endpoint || "http://localhost:8888" ;
  options.rejectUnauthorized = configOptions.rejectUnauthorized || true ;

  options.application = options.application || configOptions.name || configOptions.application ;

  if ( configOptions.profiles ) options.profiles = configOptions.profiles ;
  if ( configOptions.agent ) options.agent = configOptions.agent ;
  if ( configOptions.context ) options.context = configOptions.context ;

  return client.load(options).then(
      (config) => {
        config.forEach(
          (key, value) => {
            const config = {
              key: key,
              value: value
            };

            createNode({
              ...config,
              id: createNodeId("spring-cloud-config-" + key + "-" + value),
              parent: null,
              children: [],
              internal: {
                type: `SpringCloudConfig`,
                content: JSON.stringify(config),
                contentDigest: crypto
                  .createHash('md5')
                  .update(JSON.stringify(config))
                  .digest('hex')
                }
            });
          });
        });
}
