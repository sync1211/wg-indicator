const St = imports.gi.St;
const Main = imports.ui.main;
const Lang = imports.lang;
const Util = imports.misc.util;
const PanelMenu = imports.ui.panelMenu;
const Mainloop = imports.mainloop;
const GLib = imports.gi.GLib;
const Clutter = imports.gi.Clutter;
const Gio = imports.gi.Gio;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

//Icon theme
const DEFAULT_THEME = "color";

//Timeout
const TIMEOUT_DEFAULT = 2;

//Gsettings
const GS_SCHEMA = "org.gnome.shell.extensions.wg-indicator";
const GS_KEY_TIMEOUT = "refresh-delay";
const GS_KEY_ICONPATH = "theme";

const WgIndicator = new Lang.Class({
    Name: 'WgIndicator',
    Extends: PanelMenu.Button,

    _init: function() {
        this.parent(0.0, "WG Indicator", false);
        
        //Set timeout
        this.timeout_seconds = TIMEOUT_DEFAULT; 

        //Register settings
        this.gsettings = ExtensionUtils.getSettings(GS_SCHEMA);
        this.gsettings.connect('changed::' + GS_KEY_TIMEOUT, this._timeoutChanged.bind(this));
        this.gsettings.connect('changed::' + GS_KEY_ICONPATH, this._themeChanged.bind(this));
        this.timeout_seconds = this.gsettings.get_int(GS_KEY_TIMEOUT);
        this.icon_path = Me.dir.get_path() + "/icons/" + this.gsettings.get_string(GS_KEY_ICONPATH) + "/"; 
        
        this.icon_active = Gio.icon_new_for_string(this.icon_path + "active.svg");
        this.icon_error = Gio.icon_new_for_string(this.icon_path + "error.svg");


        //Create indicator
        this.wg_icon = new St.Icon({
            style_class: "system-status-icon",
        });

        this.add_child(this.wg_icon);
        this._refresh();
    },
   
    _timeoutChanged(){
        this.timeout_seconds = this.gsettings.get_int(GS_KEY_TIMEOUT);
        this._refresh();
    },

    
    _themeChanged(){
        this.icon_path = Me.dir.get_path() + "/icons/" + this.gsettings.get_string(GS_KEY_ICONPATH) + "/";
        this.icon_active = Gio.icon_new_for_string(this.icon_path + "active.svg");
        this.icon_error = Gio.icon_new_for_string(this.icon_path + "error.svg");
        this._refresh();
    },

    _checkWG: function() {
        //check for wireguard connections using nmcli

        //spawn process
        let process = Gio.Subprocess.new(
            ["/bin/bash", "-c", "nmcli c s --active | grep wireguard > /dev/null"],
            Gio.SubprocessFlags.NONE
        );

        //wait for process to finish
        let cancellable = new Gio.Cancellable();
        process.wait_async(cancellable, (process, result) => {
            //wait for process to finish
            process.wait_finish(result);
            
            //get status
            let status = process.get_status();
            
            //update indicator
            if (status === 256) { //disabled
                this.hide();
            } else if (status === 0) { //enabled
                this.show();
                this.wg_icon.gicon = this.icon_active;
            } else { //error
                this.wg_icon.gicon = this.icon_error;
                this.show();

                //logging
                log(status);
            }
        });
    },

    _refresh: function() {
        this._checkWG()

        if (this._timeout) {
            Mainloop.source_remove(this._timeout);
            this._timeout = null;
        }

        this._timeout = Mainloop.timeout_add_seconds(this.timeout_seconds, Lang.bind(this, this._refresh));
    }
});

let twMenu;

function init() {
}

function enable() {
    twMenu = new WgIndicator;
    Main.panel.addToStatusArea('wg-indicator', twMenu);
}

function disable() {
    if (twMenu && twMenu._timeout) {
        Mainloop.source_remove(twMenu._timeout);
    }

    twMenu.destroy();
    twMenu = null;
}
