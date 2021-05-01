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

//icons
const ICON_RED = Gio.icon_new_for_string(Me.dir.get_path()+'/icons/wg-red.svg');
const ICON_BLACK = Gio.icon_new_for_string(Me.dir.get_path()+'/icons/wg-black.svg');

//timeout
const TIMEOUT_DEFAULT = 2

//gsettings
//const GS_SCHEMA = "org.gnome.shell.extensions.wg-indicator";
//const GS_KEY_TIMEOUT = "Refresh_Delay";

const WgIndicator = new Lang.Class({
    Name: 'WgIndicator',
    Extends: PanelMenu.Button,

    _init: function() {
        this.parent(0.0, "WG Indicator", false);
        
        //icon
        this.wg_icon = new St.Icon({
            gicon: ICON_BLACK,
            style_class: "system-status-icon",
        });
        
        this.add_actor(this.wg_icon);
        this._refresh();
        
        //set timeout
        this.timeout_seconds = TIMEOUT_DEFAULT; 

        ////register settings
        //if (Gio.Settings.list_schemas().indexOf(GS_SCHEMA) !== -1) {
        //    this.gsettings = new Gio.Settings({
        //        schema: GS_SCHEMA
        //    });
        //    this.gsettings.connect('changed::' + GS_KEY_TIMEOUT, _timeoutChanged);
        //}
    },
   
    _timeoutChanged(){
        this.timeout_seconds = this.gsettings.get_int(GS_KEY_TIMEOUT);
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
                this.wg_icon.gicon = ICON_RED;
            } else { //error
                this.wg_icon.gicon = ICON_BLACK;
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
