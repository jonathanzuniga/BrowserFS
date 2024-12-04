import {FileSystemConstructor, BFSCallback, FileSystem} from './file_system';
import {ApiError} from './api_error';
import {checkOptions} from './util';
import InMemory from '../backend/InMemory';
import IndexedDB from '../backend/IndexedDB';
import MountableFileSystem from '../backend/MountableFileSystem';
import OverlayFS from '../backend/OverlayFS';
import HTTPRequest from '../backend/HTTPRequest';
import ZipFS from '../backend/ZipFS';
import IsoFS from '../backend/IsoFS';

// Monkey-patch `Create` functions to check options before file system initialization.
[InMemory, IndexedDB, IsoFS, MountableFileSystem, OverlayFS, HTTPRequest, ZipFS].forEach((fsType: FileSystemConstructor) => {
  const create = fsType.Create;
  fsType.Create = function(opts?: any, cb?: BFSCallback<FileSystem>): void {
    const oneArg = typeof(opts) === "function";
    const normalizedCb = oneArg ? opts : cb;
    const normalizedOpts = oneArg ? {} : opts;

    function wrappedCb(e?: ApiError): void {
      if (e) {
        normalizedCb(e);
      } else {
        create.call(fsType, normalizedOpts, normalizedCb);
      }
    }

    checkOptions(fsType, normalizedOpts, wrappedCb);
  };
});

/**
 * @hidden
 */
const Backends = { InMemory, IndexedDB, IsoFS, MountableFileSystem, OverlayFS, HTTPRequest, XmlHttpRequest: HTTPRequest, ZipFS };
// Make sure all backends cast to FileSystemConstructor (for type checking)
const _: {[name: string]: FileSystemConstructor} = Backends;
// tslint:disable-next-line:no-unused-expression
_;
// tslint:enable-next-line:no-unused-expression
export default Backends;
