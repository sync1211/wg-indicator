'use strict';

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

//gsettings
const GS_SCHEMA = "org.gnome.shell.extensions.wg-indicator";
const GS_KEY_TIMEOUT = "refresh-delay";
const GS_KEY_ICONPATH = "theme";


//Get shell version
var Config = imports.misc.config;
var [major] = Config.PACKAGE_VERSION.split('.');
var shellVersion = Number.parseInt(major);


const THEMES = {
    "Colored": "color",
    "Black": "black",
    "White": "white"
}   


function init() {
}

function buildPrefsWidget() {
    this.settings = ExtensionUtils.getSettings(
        GS_SCHEMA
    );

    let prefsWidget = new Gtk.Grid({
        margin: 18,
        column_spacing: 12,
        row_spacing: 12,
        visible: true
    });

    //Refresh Rate chooser
    let refreshLabel = new Gtk.Label({
        label: "Refresh delay:",
        halign: Gtk.Align.START,
        visible: true
    });
    
    let refreshField = new Gtk.Entry({
        text: this.settings.get_int(GS_KEY_TIMEOUT).toString(),
        halign: Gtk.Align.START,
        visible: true
    });
    
    refreshField.connect('changed', function(inputField) {
		settings.set_int(GS_KEY_TIMEOUT, parseInt(inputField.get_text()));
	});

    prefsWidget.attach(refreshLabel, 0, 1, 1, 1);
    prefsWidget.attach_next_to(refreshField, refreshLabel, Gtk.PositionType.RIGHT, 1, 1);

    //Theme chooser
    let themeLabel = new Gtk.Label({
        label: 'Icon theme:',
        halign: Gtk.Align.START,
        visible: true
    });
    
    let themeChooser = new Gtk.ComboBoxText({
        halign: Gtk.Align.START,
        visible: true,
    });
    
    for (let themeName in THEMES){
        themeChooser.append(THEMES[themeName], themeName);
    }
    
    themeChooser.set_active_id(this.settings.get_string(GS_KEY_ICONPATH));
    prefsWidget.attach(themeLabel, 0, 2, 1, 1);
    prefsWidget.attach_next_to(themeChooser,  themeLabel, Gtk.PositionType.RIGHT, 1, 1);

    //Set theme
    var settings = this.settings;
    themeChooser.connect('changed', function(themeWidget) {
		settings.set_string(GS_KEY_ICONPATH, themeWidget.get_active_id());
	});


    //Github link
    let githubLabel = new Gtk.Label({
        label: "\n\n<b>Check out the source code on GitHub:</b>",
        halign: Gtk.Align.START,
        use_markup: true,
        visible: true
    });

    let githubButton = new Gtk.LinkButton({
        halign: Gtk.Align.START,
        visible: true
    });

    githubButton.image = Gtk.Image.new_from_file(Me.dir.get_path() + "/.github/github.png");
    githubButton.set_uri("https://github.com/sync1211/wg-indicator/");

    prefsWidget.attach(githubLabel, 0, 3, 1, 1);
    prefsWidget.attach(githubButton, 0, 6, 1, 1);


    //Set window size: 
    prefsWidget.connect('realize', () => {

        if (shellVersion < 40){
            let window = prefsWidget.get_toplevel();
            window.resize(200, 200);
        } else {
            let window = prefsWidget.get_root();
            window.default_width = 200;
            window.default_height = 200; 
        }
    });

    return prefsWidget;
}