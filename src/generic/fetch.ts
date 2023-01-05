/**
 * Contains utility methods using 'fetch'.
 */

import {ApiError, ErrorCode} from '../core/api_error';
import {BFSCallback} from '../core/file_system';

export const fetchIsAvailable = (typeof(fetch) !== "undefined" && fetch !== null);

declare interface RequestInitWithPriority extends RequestInit {
  priority?: "auto" | "high" | "low";
}

declare global {
  interface Window {
    fetch: (
      input: RequestInfo,
      init?: RequestInitWithPriority
    ) => Promise<Response>;
  }
}

const FETCH_SETTINGS: RequestInitWithPriority = {
  cache: "no-cache",
  keepalive: false,
  priority: "high",
  referrerPolicy: "no-referrer",
  window: null,
};

/**
 * Asynchronously download a file as a buffer or a JSON object.
 * Note that the third function signature with a non-specialized type is
 * invalid, but TypeScript requires it when you specialize string arguments to
 * constants.
 * @hidden
 */
export function fetchFileAsync(p: string, type: 'buffer', cb: BFSCallback<Buffer>): void;
export function fetchFileAsync(p: string, type: 'json', cb: BFSCallback<any>): void;
export function fetchFileAsync(p: string, type: string, cb: BFSCallback<any>): void;
export function fetchFileAsync(p: string, type: string, cb: BFSCallback<any>): void {
  let request;
  try {
    request = window.fetch(p, { mode: "cors", ...FETCH_SETTINGS });
  } catch (e) {
    // XXX: fetch will throw a TypeError if the URL has credentials in it
    return cb(new ApiError(ErrorCode.EINVAL, e.message));
  }
  request
  .then((res) => {
    if (!res.ok) {
      return cb(new ApiError(ErrorCode.EIO, `fetch error: response returned code ${res.status}`));
    } else {
      switch (type) {
        case 'buffer':
          res.arrayBuffer()
            .then((buf) => cb(null, Buffer.from(buf)))
            .catch((err) => cb(new ApiError(ErrorCode.EIO, err.message)));
          break;
        case 'json':
          res.json()
            .then((json) => cb(null, json))
            .catch((err) => cb(new ApiError(ErrorCode.EIO, err.message)));
          break;
        default:
          cb(new ApiError(ErrorCode.EINVAL, "Invalid download type: " + type));
      }
    }
  })
  .catch((err) => cb(new ApiError(ErrorCode.EIO, err.message)));
}

/**
 * Asynchronously retrieves the size of the given file in bytes.
 * @hidden
 */
export function fetchFileSizeAsync(p: string, cb: BFSCallback<number>): void {
  window.fetch(p, { method: 'HEAD', mode: "no-cors", ...FETCH_SETTINGS })
    .then((res) => {
      if (!res.ok) {
        return cb(new ApiError(ErrorCode.EIO, `fetch HEAD error: response returned code ${res.status}`));
      } else {
        return cb(null, parseInt(res.headers.get('Content-Length') || '-1', 10));
      }
    })
    .catch((err) => cb(new ApiError(ErrorCode.EIO, err.message)));
}
