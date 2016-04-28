
var Module;

if (typeof Module === 'undefined') Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');

if (!Module.expectedDataFileDownloads) {
  Module.expectedDataFileDownloads = 0;
  Module.finishedDataFileDownloads = 0;
}
Module.expectedDataFileDownloads++;
(function() {
 var loadPackage = function(metadata) {

    var decrunchWorker = new Worker('crunch-worker.js');
    var decrunchCallbacks = [];
    decrunchWorker.onmessage = function(msg) {
      decrunchCallbacks[msg.data.callbackID](msg.data.data);
      console.log('decrunched ' + msg.data.filename + ' in ' + msg.data.time + ' ms, ' + msg.data.data.length + ' bytes');
      decrunchCallbacks[msg.data.callbackID] = null;
    };
    function requestDecrunch(filename, data, callback) {
      decrunchWorker.postMessage({
        filename: filename,
        data: new Uint8Array(data),
        callbackID: decrunchCallbacks.length
      });
      decrunchCallbacks.push(callback);
    }

    var PACKAGE_PATH;
    if (typeof window === 'object') {
      PACKAGE_PATH = window['encodeURIComponent'](window.location.pathname.toString().substring(0, window.location.pathname.toString().lastIndexOf('/')) + '/');
    } else if (typeof location !== 'undefined') {
      // worker
      PACKAGE_PATH = encodeURIComponent(location.pathname.toString().substring(0, location.pathname.toString().lastIndexOf('/')) + '/');
    } else {
      throw 'using preloaded data can only be done on a web page or in a web worker';
    }
    var PACKAGE_NAME = 'base.data';
    var REMOTE_PACKAGE_BASE = 'base.data';
    if (typeof Module['locateFilePackage'] === 'function' && !Module['locateFile']) {
      Module['locateFile'] = Module['locateFilePackage'];
      Module.printErr('warning: you defined Module.locateFilePackage, that has been renamed to Module.locateFile (using your locateFilePackage for now)');
    }
    var REMOTE_PACKAGE_NAME = typeof Module['locateFile'] === 'function' ?
                              Module['locateFile'](REMOTE_PACKAGE_BASE) :
                              ((Module['filePackagePrefixURL'] || '') + REMOTE_PACKAGE_BASE);
  
    var REMOTE_PACKAGE_SIZE = metadata.remote_package_size;
    var PACKAGE_UUID = metadata.package_uuid;
  
    function fetchRemotePackage(packageName, packageSize, callback, errback) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', packageName, true);
      xhr.responseType = 'arraybuffer';
      xhr.onprogress = function(event) {
        var url = packageName;
        var size = packageSize;
        if (event.total) size = event.total;
        if (event.loaded) {
          if (!xhr.addedTotal) {
            xhr.addedTotal = true;
            if (!Module.dataFileDownloads) Module.dataFileDownloads = {};
            Module.dataFileDownloads[url] = {
              loaded: event.loaded,
              total: size
            };
          } else {
            Module.dataFileDownloads[url].loaded = event.loaded;
          }
          var total = 0;
          var loaded = 0;
          var num = 0;
          for (var download in Module.dataFileDownloads) {
          var data = Module.dataFileDownloads[download];
            total += data.total;
            loaded += data.loaded;
            num++;
          }
          total = Math.ceil(total * Module.expectedDataFileDownloads/num);
          if (Module['setStatus']) Module['setStatus']('Downloading data... (' + loaded + '/' + total + ')');
        } else if (!Module.dataFileDownloads) {
          if (Module['setStatus']) Module['setStatus']('Downloading data...');
        }
      };
      xhr.onerror = function(event) {
        throw new Error("NetworkError for: " + packageName);
      }
      xhr.onload = function(event) {
        if (xhr.status == 200 || xhr.status == 304 || xhr.status == 206 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
          var packageData = xhr.response;
          callback(packageData);
        } else {
          throw new Error(xhr.statusText + " : " + xhr.responseURL);
        }
      };
      xhr.send(null);
    };

    function handleError(error) {
      console.error('package error:', error);
    };
  
      var fetched = null, fetchedCallback = null;
      fetchRemotePackage(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE, function(data) {
        if (fetchedCallback) {
          fetchedCallback(data);
          fetchedCallback = null;
        } else {
          fetched = data;
        }
      }, handleError);
    
  function runWithFS() {

    function assert(check, msg) {
      if (!check) throw msg + new Error().stack;
    }
Module['FS_createPath']('/', 'data', true, true);
Module['FS_createPath']('/', 'packages', true, true);
Module['FS_createPath']('/packages', 'textures', true, true);
Module['FS_createPath']('/packages', 'fonts', true, true);
Module['FS_createPath']('/packages', 'icons', true, true);
Module['FS_createPath']('/packages', 'particles', true, true);
Module['FS_createPath']('/packages', 'sounds', true, true);
Module['FS_createPath']('/packages/sounds', 'aard', true, true);
Module['FS_createPath']('/packages/sounds', 'q009', true, true);
Module['FS_createPath']('/packages/sounds', 'yo_frankie', true, true);
Module['FS_createPath']('/packages', 'gk', true, true);
Module['FS_createPath']('/packages/gk', 'lava', true, true);
Module['FS_createPath']('/packages', 'caustics', true, true);
Module['FS_createPath']('/packages', 'models', true, true);
Module['FS_createPath']('/packages/models', 'debris', true, true);
Module['FS_createPath']('/packages/models', 'projectiles', true, true);
Module['FS_createPath']('/packages/models/projectiles', 'rocket', true, true);
Module['FS_createPath']('/packages/models/projectiles', 'grenade', true, true);
Module['FS_createPath']('/packages', 'brushes', true, true);
Module['FS_createPath']('/packages', 'hud', true, true);

    function DataRequest(start, end, crunched, audio) {
      this.start = start;
      this.end = end;
      this.crunched = crunched;
      this.audio = audio;
    }
    DataRequest.prototype = {
      requests: {},
      open: function(mode, name) {
        this.name = name;
        this.requests[name] = this;
        Module['addRunDependency']('fp ' + this.name);
      },
      send: function() {},
      onload: function() {
        var byteArray = this.byteArray.subarray(this.start, this.end);

        if (this.crunched) {
          var ddsHeader = byteArray.subarray(0, 128);
          var that = this;
          requestDecrunch(this.name, byteArray.subarray(128), function(ddsData) {
            byteArray = new Uint8Array(ddsHeader.length + ddsData.length);
            byteArray.set(ddsHeader, 0);
            byteArray.set(ddsData, 128);
            that.finish(byteArray);
          });
        } else {

          this.finish(byteArray);

        }

      },
      finish: function(byteArray) {
        var that = this;

        Module['FS_createPreloadedFile'](this.name, null, byteArray, true, true, function() {
          Module['removeRunDependency']('fp ' + that.name);
        }, function() {
          if (that.audio) {
            Module['removeRunDependency']('fp ' + that.name); // workaround for chromium bug 124926 (still no audio with this, but at least we don't hang)
          } else {
            Module.printErr('Preloading file ' + that.name + ' failed');
          }
        }, false, true); // canOwn this data in the filesystem, it is a slide into the heap that will never change

        this.requests[this.name] = null;
      }
    };

        var files = metadata.files;
        for (i = 0; i < files.length; ++i) {
          new DataRequest(files[i].start, files[i].end, files[i].crunched, files[i].audio).open('GET', files[i].filename);
        }

  
    function processPackageData(arrayBuffer) {
      Module.finishedDataFileDownloads++;
      assert(arrayBuffer, 'Loading data file failed.');
      assert(arrayBuffer instanceof ArrayBuffer, 'bad input to processPackageData');
      var byteArray = new Uint8Array(arrayBuffer);
      var curr;
      
        // copy the entire loaded file into a spot in the heap. Files will refer to slices in that. They cannot be freed though
        // (we may be allocating before malloc is ready, during startup).
        if (Module['SPLIT_MEMORY']) Module.printErr('warning: you should run the file packager with --no-heap-copy when SPLIT_MEMORY is used, otherwise copying into the heap may fail due to the splitting');
        var ptr = Module['getMemory'](byteArray.length);
        Module['HEAPU8'].set(byteArray, ptr);
        DataRequest.prototype.byteArray = Module['HEAPU8'].subarray(ptr, ptr+byteArray.length);
  
          var files = metadata.files;
          for (i = 0; i < files.length; ++i) {
            DataRequest.prototype.requests[files[i].filename].onload();
          }
              Module['removeRunDependency']('datafile_base.data');

    };
    Module['addRunDependency']('datafile_base.data');
  
    if (!Module.preloadResults) Module.preloadResults = {};
  
      Module.preloadResults[PACKAGE_NAME] = {fromCache: false};
      if (fetched) {
        processPackageData(fetched);
        fetched = null;
      } else {
        fetchedCallback = processPackageData;
      }
    
  }
  if (Module['calledRun']) {
    runWithFS();
  } else {
    if (!Module['preRun']) Module['preRun'] = [];
    Module["preRun"].push(runWithFS); // FS is not initialized yet, wait for it
  }

  if (!Module['postRun']) Module['postRun'] = [];
  Module["postRun"].push(function() {
    decrunchWorker.terminate();
  });

 }
 loadPackage({"files": [{"audio": 0, "start": 0, "crunched": 0, "end": 7217, "filename": "/data/defaults.cfg"}, {"audio": 0, "start": 7217, "crunched": 0, "end": 10898, "filename": "/data/loading_frame.png"}, {"audio": 0, "start": 10898, "crunched": 0, "end": 58748, "filename": "/data/menus.cfg"}, {"audio": 0, "start": 58748, "crunched": 0, "end": 72300, "filename": "/data/background_decal.png"}, {"audio": 0, "start": 72300, "crunched": 0, "end": 80465, "filename": "/data/game_rpg.cfg"}, {"audio": 0, "start": 80465, "crunched": 0, "end": 80624, "filename": "/data/background_detail.png"}, {"audio": 0, "start": 80624, "crunched": 0, "end": 81637, "filename": "/data/stdlib.cfg"}, {"audio": 0, "start": 81637, "crunched": 0, "end": 84620, "filename": "/data/loading_bar.png"}, {"audio": 0, "start": 84620, "crunched": 0, "end": 90137, "filename": "/data/brush.cfg"}, {"audio": 0, "start": 90137, "crunched": 0, "end": 95021, "filename": "/data/mapshot_frame.png"}, {"audio": 0, "start": 95021, "crunched": 0, "end": 96243, "filename": "/data/default_map_settings.cfg"}, {"audio": 0, "start": 96243, "crunched": 0, "end": 104747, "filename": "/data/stdedit.cfg"}, {"audio": 0, "start": 104747, "crunched": 0, "end": 107154, "filename": "/data/keymap.cfg"}, {"audio": 0, "start": 107154, "crunched": 0, "end": 109986, "filename": "/data/guislider.png"}, {"audio": 0, "start": 109986, "crunched": 0, "end": 110058, "filename": "/data/font.cfg"}, {"audio": 0, "start": 110058, "crunched": 0, "end": 194545, "filename": "/data/glsl.cfg"}, {"audio": 0, "start": 194545, "crunched": 0, "end": 197857, "filename": "/data/teammate.png"}, {"audio": 0, "start": 197857, "crunched": 0, "end": 201623, "filename": "/data/game_fps.cfg"}, {"audio": 0, "start": 201623, "crunched": 0, "end": 206507, "filename": "/data/guioverlay.png"}, {"audio": 0, "start": 206507, "crunched": 0, "end": 209418, "filename": "/data/sounds.cfg"}, {"audio": 0, "start": 209418, "crunched": 0, "end": 299048, "filename": "/data/stdshader.cfg"}, {"audio": 0, "start": 299048, "crunched": 0, "end": 302331, "filename": "/data/hit.png"}, {"audio": 0, "start": 302331, "crunched": 0, "end": 306577, "filename": "/data/guiskin.png"}, {"audio": 0, "start": 306577, "crunched": 0, "end": 306713, "filename": "/data/default_map_models.cfg"}, {"audio": 0, "start": 306713, "crunched": 0, "end": 324275, "filename": "/data/background.png"}, {"audio": 0, "start": 324275, "crunched": 0, "end": 454481, "filename": "/data/logo.png"}, {"audio": 0, "start": 454481, "crunched": 0, "end": 457764, "filename": "/data/crosshair.png"}, {"audio": 0, "start": 457764, "crunched": 0, "end": 461695, "filename": "/data/guicursor.png"}, {"audio": 0, "start": 461695, "crunched": 0, "end": 811518, "filename": "/packages/textures/watern.jpg"}, {"audio": 0, "start": 811518, "crunched": 0, "end": 812189, "filename": "/packages/textures/readme.txt"}, {"audio": 0, "start": 812189, "crunched": 0, "end": 815225, "filename": "/packages/textures/notexture.png"}, {"audio": 0, "start": 815225, "crunched": 0, "end": 1070398, "filename": "/packages/textures/waterdudv.jpg"}, {"audio": 0, "start": 1070398, "crunched": 0, "end": 1312568, "filename": "/packages/textures/waterfalldudv.jpg"}, {"audio": 0, "start": 1312568, "crunched": 0, "end": 1349762, "filename": "/packages/textures/waterfall.jpg"}, {"audio": 0, "start": 1349762, "crunched": 0, "end": 1527324, "filename": "/packages/textures/waterfalln.jpg"}, {"audio": 0, "start": 1527324, "crunched": 0, "end": 1683327, "filename": "/packages/textures/water.jpg"}, {"audio": 0, "start": 1683327, "crunched": 0, "end": 1769451, "filename": "/packages/fonts/font.png"}, {"audio": 0, "start": 1769451, "crunched": 0, "end": 1771693, "filename": "/packages/fonts/default.cfg"}, {"audio": 0, "start": 1771693, "crunched": 0, "end": 1776418, "filename": "/packages/fonts/font_readme.txt"}, {"audio": 0, "start": 1776418, "crunched": 0, "end": 1789914, "filename": "/packages/icons/snoutx10k.jpg"}, {"audio": 0, "start": 1789914, "crunched": 0, "end": 1803194, "filename": "/packages/icons/radio_on.jpg"}, {"audio": 0, "start": 1803194, "crunched": 0, "end": 1816698, "filename": "/packages/icons/hand.jpg"}, {"audio": 0, "start": 1816698, "crunched": 0, "end": 1831832, "filename": "/packages/icons/frankie.jpg"}, {"audio": 0, "start": 1831832, "crunched": 0, "end": 1849824, "filename": "/packages/icons/menu.jpg"}, {"audio": 0, "start": 1849824, "crunched": 0, "end": 1866264, "filename": "/packages/icons/checkbox_off.jpg"}, {"audio": 0, "start": 1866264, "crunched": 0, "end": 1884940, "filename": "/packages/icons/server.jpg"}, {"audio": 0, "start": 1884940, "crunched": 0, "end": 1896602, "filename": "/packages/icons/arrow_bw.jpg"}, {"audio": 0, "start": 1896602, "crunched": 0, "end": 1896699, "filename": "/packages/icons/readme.txt"}, {"audio": 0, "start": 1896699, "crunched": 0, "end": 1909756, "filename": "/packages/icons/exit.jpg"}, {"audio": 0, "start": 1909756, "crunched": 0, "end": 1928063, "filename": "/packages/icons/action.jpg"}, {"audio": 0, "start": 1928063, "crunched": 0, "end": 1940173, "filename": "/packages/icons/arrow_fw.jpg"}, {"audio": 0, "start": 1940173, "crunched": 0, "end": 1944262, "filename": "/packages/icons/menu.png"}, {"audio": 0, "start": 1944262, "crunched": 0, "end": 1957640, "filename": "/packages/icons/info.jpg"}, {"audio": 0, "start": 1957640, "crunched": 0, "end": 1970708, "filename": "/packages/icons/chat.jpg"}, {"audio": 0, "start": 1970708, "crunched": 0, "end": 1988911, "filename": "/packages/icons/checkbox_on.jpg"}, {"audio": 0, "start": 1988911, "crunched": 0, "end": 2001806, "filename": "/packages/icons/cube.jpg"}, {"audio": 0, "start": 2001806, "crunched": 0, "end": 2020534, "filename": "/packages/icons/radio_off.jpg"}, {"audio": 0, "start": 2020534, "crunched": 0, "end": 2022801, "filename": "/packages/particles/blob.png"}, {"audio": 0, "start": 2022801, "crunched": 0, "end": 2027313, "filename": "/packages/particles/smoke.png"}, {"audio": 0, "start": 2027313, "crunched": 0, "end": 2084477, "filename": "/packages/particles/bullet.png"}, {"audio": 0, "start": 2084477, "crunched": 0, "end": 2146629, "filename": "/packages/particles/ball2.png"}, {"audio": 0, "start": 2146629, "crunched": 0, "end": 2216821, "filename": "/packages/particles/flames.png"}, {"audio": 0, "start": 2216821, "crunched": 0, "end": 2542721, "filename": "/packages/particles/lensflares.png"}, {"audio": 0, "start": 2542721, "crunched": 0, "end": 2542965, "filename": "/packages/particles/readme.txt"}, {"audio": 0, "start": 2542965, "crunched": 0, "end": 3276444, "filename": "/packages/particles/explosion.png"}, {"audio": 0, "start": 3276444, "crunched": 0, "end": 3296582, "filename": "/packages/particles/muzzleflash3.jpg"}, {"audio": 0, "start": 3296582, "crunched": 0, "end": 3354444, "filename": "/packages/particles/lightning.jpg"}, {"audio": 0, "start": 3354444, "crunched": 0, "end": 3373949, "filename": "/packages/particles/circle.png"}, {"audio": 0, "start": 3373949, "crunched": 0, "end": 3374194, "filename": "/packages/particles/readme.txt~"}, {"audio": 0, "start": 3374194, "crunched": 0, "end": 3381609, "filename": "/packages/particles/steam.png"}, {"audio": 0, "start": 3381609, "crunched": 0, "end": 3382470, "filename": "/packages/particles/flare.jpg"}, {"audio": 0, "start": 3382470, "crunched": 0, "end": 3401492, "filename": "/packages/particles/muzzleflash2.jpg"}, {"audio": 0, "start": 3401492, "crunched": 0, "end": 3417118, "filename": "/packages/particles/blood.png"}, {"audio": 0, "start": 3417118, "crunched": 0, "end": 3437019, "filename": "/packages/particles/muzzleflash1.jpg"}, {"audio": 0, "start": 3437019, "crunched": 0, "end": 3438824, "filename": "/packages/particles/spark.png"}, {"audio": 0, "start": 3438824, "crunched": 0, "end": 3492756, "filename": "/packages/particles/ball1.png"}, {"audio": 0, "start": 3492756, "crunched": 0, "end": 3532592, "filename": "/packages/particles/scorch.png"}, {"audio": 0, "start": 3532592, "crunched": 0, "end": 3535490, "filename": "/packages/particles/base.png"}, {"audio": 1, "start": 3535490, "crunched": 0, "end": 3543450, "filename": "/packages/sounds/aard/pain5.wav"}, {"audio": 1, "start": 3543450, "crunched": 0, "end": 3568920, "filename": "/packages/sounds/aard/pain1.wav"}, {"audio": 1, "start": 3568920, "crunched": 0, "end": 3578330, "filename": "/packages/sounds/aard/pain2.wav"}, {"audio": 1, "start": 3578330, "crunched": 0, "end": 3584976, "filename": "/packages/sounds/aard/weapload.wav"}, {"audio": 1, "start": 3584976, "crunched": 0, "end": 3597290, "filename": "/packages/sounds/aard/itempick.wav"}, {"audio": 1, "start": 3597290, "crunched": 0, "end": 3607004, "filename": "/packages/sounds/aard/die1.wav"}, {"audio": 1, "start": 3607004, "crunched": 0, "end": 3614670, "filename": "/packages/sounds/aard/pain6.wav"}, {"audio": 1, "start": 3614670, "crunched": 0, "end": 3618364, "filename": "/packages/sounds/aard/grunt2.wav"}, {"audio": 1, "start": 3618364, "crunched": 0, "end": 3630226, "filename": "/packages/sounds/aard/bang.wav"}, {"audio": 1, "start": 3630226, "crunched": 0, "end": 3641632, "filename": "/packages/sounds/aard/grunt1.wav"}, {"audio": 1, "start": 3641632, "crunched": 0, "end": 3652994, "filename": "/packages/sounds/aard/land.wav"}, {"audio": 1, "start": 3652994, "crunched": 0, "end": 3657126, "filename": "/packages/sounds/aard/jump.wav"}, {"audio": 1, "start": 3657126, "crunched": 0, "end": 3665106, "filename": "/packages/sounds/aard/pain4.wav"}, {"audio": 1, "start": 3665106, "crunched": 0, "end": 3666810, "filename": "/packages/sounds/aard/tak.wav"}, {"audio": 1, "start": 3666810, "crunched": 0, "end": 3677462, "filename": "/packages/sounds/aard/die2.wav"}, {"audio": 1, "start": 3677462, "crunched": 0, "end": 3686812, "filename": "/packages/sounds/aard/pain3.wav"}, {"audio": 1, "start": 3686812, "crunched": 0, "end": 3690870, "filename": "/packages/sounds/aard/outofammo.wav"}, {"audio": 1, "start": 3690870, "crunched": 0, "end": 3824656, "filename": "/packages/sounds/q009/ren.ogg"}, {"audio": 1, "start": 3824656, "crunched": 0, "end": 3850912, "filename": "/packages/sounds/q009/minigun3.ogg"}, {"audio": 1, "start": 3850912, "crunched": 0, "end": 3868787, "filename": "/packages/sounds/q009/outofammo.ogg"}, {"audio": 1, "start": 3868787, "crunched": 0, "end": 3902015, "filename": "/packages/sounds/q009/glauncher3.ogg"}, {"audio": 1, "start": 3902015, "crunched": 0, "end": 3959660, "filename": "/packages/sounds/q009/rlauncher3.ogg"}, {"audio": 1, "start": 3959660, "crunched": 0, "end": 4062726, "filename": "/packages/sounds/q009/ren2.ogg"}, {"audio": 1, "start": 4062726, "crunched": 0, "end": 4090434, "filename": "/packages/sounds/q009/quaddamage_shoot.ogg"}, {"audio": 0, "start": 4090434, "crunched": 0, "end": 4091750, "filename": "/packages/sounds/q009/readme.txt"}, {"audio": 1, "start": 4091750, "crunched": 0, "end": 4220787, "filename": "/packages/sounds/q009/rifle.ogg"}, {"audio": 1, "start": 4220787, "crunched": 0, "end": 4249181, "filename": "/packages/sounds/q009/pistol.ogg"}, {"audio": 1, "start": 4249181, "crunched": 0, "end": 4277068, "filename": "/packages/sounds/q009/minigun.ogg"}, {"audio": 1, "start": 4277068, "crunched": 0, "end": 4309690, "filename": "/packages/sounds/q009/quaddamage_out.ogg"}, {"audio": 1, "start": 4309690, "crunched": 0, "end": 4336590, "filename": "/packages/sounds/q009/pistol3.ogg"}, {"audio": 1, "start": 4336590, "crunched": 0, "end": 4362763, "filename": "/packages/sounds/q009/teleport.ogg"}, {"audio": 1, "start": 4362763, "crunched": 0, "end": 4381654, "filename": "/packages/sounds/q009/jumppad.ogg"}, {"audio": 1, "start": 4381654, "crunched": 0, "end": 4505874, "filename": "/packages/sounds/q009/rifle2.ogg"}, {"audio": 1, "start": 4505874, "crunched": 0, "end": 4529202, "filename": "/packages/sounds/q009/minigun2.ogg"}, {"audio": 1, "start": 4529202, "crunched": 0, "end": 4559184, "filename": "/packages/sounds/q009/explosion.ogg"}, {"audio": 1, "start": 4559184, "crunched": 0, "end": 4684264, "filename": "/packages/sounds/q009/shotgun.ogg"}, {"audio": 1, "start": 4684264, "crunched": 0, "end": 4719706, "filename": "/packages/sounds/q009/glauncher2.ogg"}, {"audio": 1, "start": 4719706, "crunched": 0, "end": 4753393, "filename": "/packages/sounds/q009/glauncher.ogg"}, {"audio": 1, "start": 4753393, "crunched": 0, "end": 4781775, "filename": "/packages/sounds/q009/pistol2.ogg"}, {"audio": 0, "start": 4781775, "crunched": 0, "end": 4801215, "filename": "/packages/sounds/q009/license.txt"}, {"audio": 1, "start": 4801215, "crunched": 0, "end": 4917654, "filename": "/packages/sounds/q009/ren3.ogg"}, {"audio": 1, "start": 4917654, "crunched": 0, "end": 4938097, "filename": "/packages/sounds/q009/weapswitch.ogg"}, {"audio": 1, "start": 4938097, "crunched": 0, "end": 4996034, "filename": "/packages/sounds/q009/rlauncher.ogg"}, {"audio": 1, "start": 4996034, "crunched": 0, "end": 5054733, "filename": "/packages/sounds/q009/rlauncher2.ogg"}, {"audio": 1, "start": 5054733, "crunched": 0, "end": 5177416, "filename": "/packages/sounds/q009/rifle3.ogg"}, {"audio": 1, "start": 5177416, "crunched": 0, "end": 5303518, "filename": "/packages/sounds/q009/shotgun2.ogg"}, {"audio": 1, "start": 5303518, "crunched": 0, "end": 5427916, "filename": "/packages/sounds/q009/shotgun3.ogg"}, {"audio": 0, "start": 5427916, "crunched": 0, "end": 5428546, "filename": "/packages/sounds/yo_frankie/readme.txt"}, {"audio": 1, "start": 5428546, "crunched": 0, "end": 5452451, "filename": "/packages/sounds/yo_frankie/watersplash2.ogg"}, {"audio": 1, "start": 5452451, "crunched": 0, "end": 5459864, "filename": "/packages/sounds/yo_frankie/sfx_interact.ogg"}, {"audio": 1, "start": 5459864, "crunched": 0, "end": 5479473, "filename": "/packages/sounds/yo_frankie/amb_waterdrip_2.ogg"}, {"audio": 0, "start": 5479473, "crunched": 1, "end": 5536248, "filename": "/packages/gk/lava/lava_cc.dds"}, {"audio": 0, "start": 5536248, "crunched": 1, "end": 5652410, "filename": "/packages/gk/lava/lava_nm.dds"}, {"audio": 0, "start": 5652410, "crunched": 0, "end": 5676929, "filename": "/packages/caustics/caust00.png"}, {"audio": 0, "start": 5676929, "crunched": 0, "end": 5700373, "filename": "/packages/caustics/caust22.png"}, {"audio": 0, "start": 5700373, "crunched": 0, "end": 5723697, "filename": "/packages/caustics/caust06.png"}, {"audio": 0, "start": 5723697, "crunched": 0, "end": 5747564, "filename": "/packages/caustics/caust07.png"}, {"audio": 0, "start": 5747564, "crunched": 0, "end": 5772750, "filename": "/packages/caustics/caust13.png"}, {"audio": 0, "start": 5772750, "crunched": 0, "end": 5796251, "filename": "/packages/caustics/caust28.png"}, {"audio": 0, "start": 5796251, "crunched": 0, "end": 5820415, "filename": "/packages/caustics/caust11.png"}, {"audio": 0, "start": 5820415, "crunched": 0, "end": 5844059, "filename": "/packages/caustics/caust27.png"}, {"audio": 0, "start": 5844059, "crunched": 0, "end": 5844117, "filename": "/packages/caustics/readme.txt"}, {"audio": 0, "start": 5844117, "crunched": 0, "end": 5868279, "filename": "/packages/caustics/caust08.png"}, {"audio": 0, "start": 5868279, "crunched": 0, "end": 5892395, "filename": "/packages/caustics/caust02.png"}, {"audio": 0, "start": 5892395, "crunched": 0, "end": 5915970, "filename": "/packages/caustics/caust03.png"}, {"audio": 0, "start": 5915970, "crunched": 0, "end": 5940419, "filename": "/packages/caustics/caust15.png"}, {"audio": 0, "start": 5940419, "crunched": 0, "end": 5964244, "filename": "/packages/caustics/caust10.png"}, {"audio": 0, "start": 5964244, "crunched": 0, "end": 5987442, "filename": "/packages/caustics/caust04.png"}, {"audio": 0, "start": 5987442, "crunched": 0, "end": 6011325, "filename": "/packages/caustics/caust09.png"}, {"audio": 0, "start": 6011325, "crunched": 0, "end": 6035075, "filename": "/packages/caustics/caust29.png"}, {"audio": 0, "start": 6035075, "crunched": 0, "end": 6059432, "filename": "/packages/caustics/caust16.png"}, {"audio": 0, "start": 6059432, "crunched": 0, "end": 6082638, "filename": "/packages/caustics/caust25.png"}, {"audio": 0, "start": 6082638, "crunched": 0, "end": 6106892, "filename": "/packages/caustics/caust30.png"}, {"audio": 0, "start": 6106892, "crunched": 0, "end": 6131384, "filename": "/packages/caustics/caust01.png"}, {"audio": 0, "start": 6131384, "crunched": 0, "end": 6155927, "filename": "/packages/caustics/caust31.png"}, {"audio": 0, "start": 6155927, "crunched": 0, "end": 6180979, "filename": "/packages/caustics/caust14.png"}, {"audio": 0, "start": 6180979, "crunched": 0, "end": 6203849, "filename": "/packages/caustics/caust05.png"}, {"audio": 0, "start": 6203849, "crunched": 0, "end": 6228390, "filename": "/packages/caustics/caust18.png"}, {"audio": 0, "start": 6228390, "crunched": 0, "end": 6251665, "filename": "/packages/caustics/caust23.png"}, {"audio": 0, "start": 6251665, "crunched": 0, "end": 6275303, "filename": "/packages/caustics/caust21.png"}, {"audio": 0, "start": 6275303, "crunched": 0, "end": 6298857, "filename": "/packages/caustics/caust26.png"}, {"audio": 0, "start": 6298857, "crunched": 0, "end": 6323036, "filename": "/packages/caustics/caust19.png"}, {"audio": 0, "start": 6323036, "crunched": 0, "end": 6347777, "filename": "/packages/caustics/caust12.png"}, {"audio": 0, "start": 6347777, "crunched": 0, "end": 6370946, "filename": "/packages/caustics/caust24.png"}, {"audio": 0, "start": 6370946, "crunched": 0, "end": 6395425, "filename": "/packages/caustics/caust17.png"}, {"audio": 0, "start": 6395425, "crunched": 0, "end": 6419531, "filename": "/packages/caustics/caust20.png"}, {"audio": 0, "start": 6419531, "crunched": 0, "end": 6419774, "filename": "/packages/models/debris/md2.cfg"}, {"audio": 0, "start": 6419774, "crunched": 0, "end": 6434550, "filename": "/packages/models/debris/tris.md2"}, {"audio": 0, "start": 6434550, "crunched": 0, "end": 6626376, "filename": "/packages/models/debris/skin.png"}, {"audio": 0, "start": 6626376, "crunched": 0, "end": 6629512, "filename": "/packages/models/projectiles/rocket/rocket.iqm"}, {"audio": 0, "start": 6629512, "crunched": 0, "end": 6630172, "filename": "/packages/models/projectiles/rocket/readme.txt"}, {"audio": 0, "start": 6630172, "crunched": 0, "end": 6643409, "filename": "/packages/models/projectiles/rocket/skin.jpg"}, {"audio": 0, "start": 6643409, "crunched": 0, "end": 6664177, "filename": "/packages/models/projectiles/rocket/mask.jpg"}, {"audio": 0, "start": 6664177, "crunched": 0, "end": 6671896, "filename": "/packages/models/projectiles/rocket/normal.jpg"}, {"audio": 0, "start": 6671896, "crunched": 0, "end": 6672052, "filename": "/packages/models/projectiles/rocket/iqm.cfg"}, {"audio": 0, "start": 6672052, "crunched": 0, "end": 6672190, "filename": "/packages/models/projectiles/grenade/iqm.cfg"}, {"audio": 0, "start": 6672190, "crunched": 0, "end": 6676522, "filename": "/packages/brushes/circle_64_hard.png"}, {"audio": 0, "start": 6676522, "crunched": 0, "end": 6677705, "filename": "/packages/brushes/square_32_hard.png"}, {"audio": 0, "start": 6677705, "crunched": 0, "end": 6677834, "filename": "/packages/brushes/gradient_64.png"}, {"audio": 0, "start": 6677834, "crunched": 0, "end": 6678829, "filename": "/packages/brushes/circle_8_solid.png"}, {"audio": 0, "start": 6678829, "crunched": 0, "end": 6679810, "filename": "/packages/brushes/square_32_solid.png"}, {"audio": 0, "start": 6679810, "crunched": 0, "end": 6679947, "filename": "/packages/brushes/gradient_128.png"}, {"audio": 0, "start": 6679947, "crunched": 0, "end": 6680939, "filename": "/packages/brushes/circle_8_soft.png"}, {"audio": 0, "start": 6680939, "crunched": 0, "end": 6681042, "filename": "/packages/brushes/gradient_16.png"}, {"audio": 0, "start": 6681042, "crunched": 0, "end": 6681101, "filename": "/packages/brushes/readme.txt"}, {"audio": 0, "start": 6681101, "crunched": 0, "end": 6682223, "filename": "/packages/brushes/circle_16_hard.png"}, {"audio": 0, "start": 6682223, "crunched": 0, "end": 6686311, "filename": "/packages/brushes/circle_128_hard.png"}, {"audio": 0, "start": 6686311, "crunched": 0, "end": 6689871, "filename": "/packages/brushes/circle_32_hard.png"}, {"audio": 0, "start": 6689871, "crunched": 0, "end": 6690867, "filename": "/packages/brushes/circle_8_hard.png"}, {"audio": 0, "start": 6690867, "crunched": 0, "end": 6691873, "filename": "/packages/brushes/square_64_solid.png"}, {"audio": 0, "start": 6691873, "crunched": 0, "end": 6701508, "filename": "/packages/brushes/noise_128.png"}, {"audio": 0, "start": 6701508, "crunched": 0, "end": 6702481, "filename": "/packages/brushes/square_16_solid.png"}, {"audio": 0, "start": 6702481, "crunched": 0, "end": 6705958, "filename": "/packages/brushes/circle_128_soft.png"}, {"audio": 0, "start": 6705958, "crunched": 0, "end": 6707049, "filename": "/packages/brushes/circle_16_soft.png"}, {"audio": 0, "start": 6707049, "crunched": 0, "end": 6707169, "filename": "/packages/brushes/gradient_32.png"}, {"audio": 0, "start": 6707169, "crunched": 0, "end": 6709533, "filename": "/packages/brushes/circle_128_solid.png"}, {"audio": 0, "start": 6709533, "crunched": 0, "end": 6710646, "filename": "/packages/brushes/circle_16_solid.png"}, {"audio": 0, "start": 6710646, "crunched": 0, "end": 6712460, "filename": "/packages/brushes/circle_64_soft.png"}, {"audio": 0, "start": 6712460, "crunched": 0, "end": 6713745, "filename": "/packages/brushes/circle_32_soft.png"}, {"audio": 0, "start": 6713745, "crunched": 0, "end": 6714827, "filename": "/packages/brushes/square_16_hard.png"}, {"audio": 0, "start": 6714827, "crunched": 0, "end": 6716034, "filename": "/packages/brushes/square_64_hard.png"}, {"audio": 0, "start": 6716034, "crunched": 0, "end": 6717272, "filename": "/packages/brushes/circle_32_solid.png"}, {"audio": 0, "start": 6717272, "crunched": 0, "end": 6718856, "filename": "/packages/brushes/circle_64_solid.png"}, {"audio": 0, "start": 6718856, "crunched": 0, "end": 6721146, "filename": "/packages/brushes/noise_64.png"}, {"audio": 0, "start": 6721146, "crunched": 0, "end": 6864890, "filename": "/packages/hud/damage.png"}, {"audio": 0, "start": 6864890, "crunched": 0, "end": 6864961, "filename": "/packages/hud/readme.txt"}, {"audio": 0, "start": 6864961, "crunched": 0, "end": 6886282, "filename": "/packages/hud/wasm.png"}, {"audio": 0, "start": 6886282, "crunched": 0, "end": 6907587, "filename": "/packages/hud/js.png"}, {"audio": 0, "start": 6907587, "crunched": 0, "end": 7012988, "filename": "/packages/hud/items.png"}], "remote_package_size": 7012988, "package_uuid": "116da059-c1a5-40df-b5dc-7c0c02e2cfb4"});

})();

