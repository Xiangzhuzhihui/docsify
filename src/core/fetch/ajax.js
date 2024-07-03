/* eslint-disable no-unused-vars */
import Cookies from 'js-cookie';
import progressbar from '../render/progressbar';
import { hasOwn, noop } from '../util/core';

const TokenKey = 'xzzh_doc_token';
const RefTokenKey = 'xzzh_doc_refsh_token';

export function getToken() {
  return Cookies.get(TokenKey);
}

export function setRefToken(token) {
  return Cookies.set(RefTokenKey, token);
}

export function getRefToken() {
  return Cookies.get(RefTokenKey);
}

export function setToken(token) {
  return Cookies.set(TokenKey, token);
}

export function setKv(key, value) {
  return Cookies.set(key, value);
}

const cache = {};

/**
 * Ajax GET implmentation
 * @param {string} url Resource URL
 * @param {boolean} [hasBar=false] Has progress bar
 * @param {String[]} headers Array of headers
 * @return {Promise} Promise response
 */
export function get(url, hasBar = false, headers = {}) {
  const xhr = new XMLHttpRequest();
  const on = function () {
    xhr.addEventListener.apply(xhr, arguments);
  };

  const cached = cache[url];

  if (cached) {
    return { then: cb => cb(cached.content, cached.opt), abort: noop };
  }

  xhr.open('GET', url);
  for (const i in headers) {
    if (hasOwn.call(headers, i)) {
      xhr.setRequestHeader(i, headers[i]);
    }
  }
  setKv('last_url', window.location.href);
  xhr.setRequestHeader('Authorization', getToken());
  xhr.send();

  return {
    then: function (success, error = noop) {
      if (hasBar) {
        const id = setInterval(
          _ =>
            progressbar({
              step: Math.floor(Math.random() * 5 + 1),
            }),
          500
        );

        on('progress', progressbar);
        on('loadend', evt => {
          progressbar(evt);
          clearInterval(id);
        });
      }

      on('error', error);
      on('load', ({ target }) => {
        if (target.status === 401) {
          window.location.href = `https://***.****.cn/login?redirectUrl=https://**.**.com.cn`;
        }
        if (target.status >= 400) {
          error(target);
        } else {
          const result = (cache[url] = {
            content: target.response,
            opt: {
              updatedAt: xhr.getResponseHeader('last-modified'),
            },
          });

          success(result.content, result.opt);
        }
      });
    },
    abort: _ => xhr.readyState !== 4 && xhr.abort(),
  };
}
