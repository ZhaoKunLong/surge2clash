/* eslint no-fallthrough: 0 */
const ini = require('ini');
const jsYaml = require('js-yaml');
const surgeText = require('./surgeText')
fs = require('fs')
const clashConf = {
  port: 7890,
  'socks-port': 1080,
  'redir-port':7892,
  'allow-lan': true,
  mode: 'Rule',
  'log-level': 'info',
  'external-controller': '127.0.0.1:9090',
  secret: ''

};

// eslint-disable-next-line complexity
function surge2Clash(surgeConfText, query) {
  const surgeConf = ini.parse(surgeConfText);
  
  const dns = {
    enable: !!query.dns,
    listen: '0.0.0.0:53',
    fallback: '8.8.8.8'
  };

  dns.nameserver = surgeConf.General['dns-server'].split(/,\s+/).filter(i => i.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/) || i.match(/^\w+:\/\//));
  dns.ipv6 = surgeConf.General.ipv6 || false;
  if(!query.win) {
    clashConf.dns = dns;
  }
  const proxys = [];

  for (const name of Object.keys(surgeConf.Proxy)) {
    const proxy = surgeConf.Proxy[name].split(/,\s*/);
    let tls = false;
    let proxyConf;
    let protocol;
    let i = 1;
    // eslint-disable-next-line default-case
    switch (proxy[0]) {
      case 'custom':
        protocol = 'ss';
        proxys.push({
          name,
          type: protocol,
          server: proxy[i++],
          port: parseInt(proxy[i++], 10),
          cipher: proxy[i++],
          password: proxy[i++]
        });
        break;
      case 'https':
        protocol = 'http';
        tls = true;
      case 'http':
        protocol = 'http';
        proxyConf = {
          name,
          type: protocol,
          server: proxy[i++],
          port: parseInt(proxy[i++], 10)
        };
        if (tls) {
          proxyConf.tls = true;
        }

        if (proxy[i++]) {
          proxyConf.username = proxy[i++];
        }

        if (proxy[i++]) {
          proxyConf.password = proxy[i++];
        }

        if (proxy.length > i) {
          for (let {length} = proxy; i < length; i++) {
            const [key, value] = proxy[i].split('=');
            // eslint-disable-next-line max-depth
            if (key === 'skip-cert-verify') {
              proxyConf['skip-cert-verify'] = value;
            }
          }
        }

        if (query.win) {
          proxy.push(proxyConf);
        } else {
          proxy.push(JSON.stringify(proxyConf));
        }

        break;
      case 'socks5-tls':
        protocol = 'socks5';
        tls = true;
      case 'socks5':
        protocol = 'socks5';
        proxyConf = {
          name,
          type: protocol,
          server: proxy[i++],
          port: proxy[i++]
        };
        if (tls) {
          proxyConf.tls = true;
        }

        if (proxy[i++]) {
          proxyConf.username = proxy[i++];
        }

        if (proxy[i++]) {
          proxyConf.password = proxy[i++];
        }

        if (proxy.length > i) {
          for (let {length} = proxy; i < length; i++) {
            const [key, value] = proxy[i].split('=');
            // eslint-disable-next-line max-depth
            if (key === 'skip-cert-verify') {
              proxyConf['skip-cert-verify'] = value;
            }
          }
        }

        if (query.win) {
          proxy.push(proxyConf);
        } else {
          proxy.push(JSON.stringify(proxyConf));
        }
    }
  }

  const proxyGroups = [];
  for (const name of Object.keys(surgeConf['Proxy Group'])) {
    const group = surgeConf['Proxy Group'][name].split(/,\s*/);
    const each = {
      name,
      type: group[0]
    };
    const proxies = [];
    for (let i = 1; i < group.length; i++) {
      if (Object.keys(surgeConf.Proxy).includes(group[i])) {
        proxies.push(group[i]);
      } else if (group[i].indexOf('=') !== -1) {
        const [key, val] = group[i].split(/\s*=\s*/);
        each[key] = val;
      }
    }

    each.proxies = proxies;
    proxyGroups.push(each);
  }

  proxyGroups.map((group, index) => {
    if (group.name == 'Dler Cloud') { 
      group.proxies[0] = 'Auto - UrlTest'
    }
    if (group.proxies.includes('Direct')) { 
      group.proxies[group.proxies.indexOf('Direct')] = 'DIRECT'; 
      group.proxies.unshift('Auto - UrlTest')
    }
    if (group.proxies.includes('Reject')) {
      group.proxies[group.proxies.indexOf('Reject')] = 'REJECT'
    }
  })

  clashConf.Proxy = proxys;
  clashConf['Proxy Group'] = proxyGroups;
  clashConf.Rule = Object.keys(surgeConf.Rule).map(i => {
    return i.replace(/no-resolve|,\s*no-resolve|,\s*force-remote-dns|force-remote-dns|\s*-\s*reject/, '');
  }).filter(i => !i.startsWith('USER-AGENT') && !i.startsWith('PROCESS-NAME') && !i.startsWith('URL-REGEX') && !i.startsWith('/') && !i.startsWith('FINAL') && !i.startsWith('GEOIP'));
  delete query.win;
  delete query.url;
  if (query.port) {
    query.port = parseInt(query.port, 10);
  }

  if (query['socks-port']) {
    query.port = parseInt(query['socks-port'], 10);
  }

  if (query['redir-port']) {
    query.port = parseInt(query['redir-port'], 10);
  }

  const ret = Object.assign(clashConf, query);
  const name = 'tempSurgeToCloud'
  fs.writeFileSync(`${name}.yaml`, jsYaml.dump(ret));
  // return (jsYaml.dump(ret));
}


surge2Clash(surgeText, {win:1})
module.exports = surge2Clash;
