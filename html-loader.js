/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
const attrParse = require('./lib/attributesParser');
const loaderUtils = require('loader-utils');
const url = require('url');
const assign = require('object-assign');

function randomIdent() {
  return `xxxHTMLLINKxxx${Math.random()}${Math.random()}xxx`;
}

function getLoaderConfig(context) {
  const query = loaderUtils.getOptions(context) || {};
  const configKey = query.config || 'htmlLoader';
  const config = context.options && context.options.hasOwnProperty(configKey) ? context.options[configKey] : {};

  delete query.config;

  return assign(query, config);
}

module.exports = function(content) {
  this.cacheable && this.cacheable();
  const config = getLoaderConfig(this);
  let attributes = ['img:src'];
  if (config.attrs !== undefined) {
    if (typeof config.attrs === 'string') {
      attributes = config.attrs.split(' ');
    } else if (Array.isArray(config.attrs)) {
      attributes = config.attrs;
    } else if (config.attrs === false) {
      attributes = [];
    } else {
      throw new Error('Invalid value to config parameter attrs');
    }
  }
  const root = config.root;
  const links = attrParse(content, (tag, attr) => {
    const res = attributes.find(a => {
      if (a.charAt(0) === ':') {
        return attr === a.slice(1);
      } else {
        return (`${tag}:${attr}`) === a;
      }
    });
    return !!res;
  });
  links.reverse();
  const data = {};
  content = [content];
  links.forEach(link => {
    if (!loaderUtils.isUrlRequest(link.value, root)) return;

    if (link.value.indexOf('mailto:') > -1) return;

    const uri = url.parse(link.value);
    if (uri.hash !== null && uri.hash !== undefined) {
      uri.hash = null;
      link.value = uri.format();
      link.length = link.value.length;
    }

    let ident;
    do {
      ident = randomIdent();
    } while (data[ident]);
    data[ident] = link.value;
    const x = content.pop();
    content.push(x.substr(link.start + link.length));
    content.push(ident);
    content.push(x.substr(0, link.start));
  });
  content.reverse();
  content = content.join('');

  if (config.interpolate === 'require') {
    const reg = /\$\{require\([^)]*\)\}/g;
    let result;
    const reqList = [];
    while (result = reg.exec(content)) {
      reqList.push({
        length: result[0].length,
        start: result.index,
        value: result[0],
      });
    }
    reqList.reverse();
    content = [content];
    reqList.forEach(link => {
      const x = content.pop();
      let ident;
      do {
        ident = randomIdent();
      } while (data[ident]);
      data[ident] = link.value.substring(11, link.length - 3);
      content.push(x.substr(link.start + link.length));
      content.push(ident);
      content.push(x.substr(0, link.start));
    });
    content.reverse();
    content = content.join('');
  }

  if (config.interpolate && config.interpolate !== 'require') {
    // Double escape quotes so that they are not unescaped completely in the template string
    content = content.replace(/\\"/g, '\\\\"');
    content = content.replace(/\\'/g, '\\\\\'');
  } else {
    content = JSON.stringify(content);
  }

  let exportsString = 'module.exports = ';
  if (config.exportAsDefault) {
    exportsString = 'exports.default = ';
  } else if (config.exportAsEs6Default) {
    exportsString = 'export default ';
  }

  const contentVar = content.replace(/xxxHTMLLINKxxx[0-9\.]+xxx/g, match => {
    if (!data[match]) return match;

    let urlToRequest;

    if (config.interpolate === 'require') {
      urlToRequest = data[match];
    } else {
      urlToRequest = loaderUtils.urlToRequest(data[match], root);
    }

    return `" + require(${JSON.stringify(urlToRequest)}) + "`;
  });

  return `${exportsString + contentVar};`;
};
