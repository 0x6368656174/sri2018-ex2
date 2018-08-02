/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
const Parser = require('fastparse');

const processMatch = function(match, strUntilValue, name, value, index) {
  if (!this.isRelevantTagAttr(this.currentTag, name)) return;
  this.results.push({
    start: index + strUntilValue.length,
    length: value.length,
    value,
  });
};

const parser = new Parser({
  outside: {
    '<!--.*?-->': true,
    '<![CDATA[.*?]]>': true,
    '<[!\\?].*?>': true,
    '<\/[^>]+>': true,
    '<([a-zA-Z\\-:]+)\\s*'(match, tagName) {
      this.currentTag = tagName;
      return 'inside';
    },
  },
  inside: {
    '\\s+': true, // eat up whitespace
    '>': 'outside', // end of attributes
    '(([0-9a-zA-Z\\-:]+)\\s*=\\s*")([^"]*)"': processMatch,
    '(([0-9a-zA-Z\\-:]+)\\s*=\\s*\')([^\']*)\'': processMatch,
    '(([0-9a-zA-Z\\-:]+)\\s*=\\s*)([^\\s>]+)': processMatch,
  },
});

module.exports = function parse(html, isRelevantTagAttr) {
  const result = parser.parse('outside', html, {
    currentTag: null,
    results: [],
    isRelevantTagAttr,
  }).results;

  const fixedResult = [];

  for (const link of result) {
    const {start} = link;
    const links = link.value.split(',')
      .map(value => value.trim())
      .filter(value => !!value)
      .map(value => value.split(' ')[0])
      .map(value => {
        return {
          value,
          start: start + link.value.indexOf(value),
          length: value.length,
        };
      });

    fixedResult.push(...links);
  }

  return fixedResult;
};
