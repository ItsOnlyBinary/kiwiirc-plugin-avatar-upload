# plugin-avatar-upload for [Kiwi IRC](https://kiwiirc.com)

This plugin allows users to upload their own avatars.

It requires the ircd to support EXTJWT tokens, and a php server to upload the avatars to.

#### Dependencies
* node (https://nodejs.org/)
* yarn (https://yarnpkg.com/)

#### Building and installing

1. Build the plugin

   ```console
   $ yarn
   $ yarn build
   ```

   The plugin will then be created at `dist/plugin-avatar-upload.js`

2. Copy the plugin to your Kiwi webserver

   The plugin file must be loadable from a webserver. Creating a `plugins/` folder with your KiwiIRC files is a good place to put it.

3. Add the plugin to KiwiIRC

   In your kiwi `config.json` file, find the `plugins` section and add:
   ```json
   {"name": "avatar-upload", "url": "/plugins/plugin-avatar-upload.js"}
   ```

   > note: This plugin changes its behaviour based on the presence of other plugins. It is recommended to load this plugin after `plugin-asl` and `plugin-avatars`


#### Configuration

``` json5
"plugin-avatar-upload" : {
    // Url path to api.php
    "api_url": "/path/to/api.php",

    // Url path to avatar storage directory
    "avatars_url": '/path/to/avatars/',

    // Avatars will be preloaded to check they exist on the server
    // with this set to false it it recommended to have a default avatar
    // in place of the 404 page for your avatars directory
    "preload_avatars": true,

    // Enables the setting of account avatars
    "set_avatars": true,
},
```

## License

[Licensed under the Apache License, Version 2.0](LICENSE).
