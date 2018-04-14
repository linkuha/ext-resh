## RegExp Search and Highlight
ver. 0.1.3
=============

This is the chrome extension.
Still in progress, i write it for facilitating some log analyze.

Find text content with regular expression and highlight it, or collapse unnecessary blocks. 
You can to add "url matches" for permanent enabling on some domains / pages.

### Features:
* local storage of preferences (currently there is no need for synchronized storage)
* import / export profiles
* enable / disable on tab
* customizable work mode (e.g. you can add regexp matching to needly URL's, where extension will active always)
* color changing ability for every regexp and collapse block
* reading sequential text elements, to which chrome devide the content due to constraints (~ 65535 length). Bypassing the built-in elements is not implemented for a variety of reasons and also as useless
* notifying activated tabs when profile is modified

---------------------

### TODO
* store page in cache for ability to rerun functions (will fully work by "refresh" button in popup) without page reloading
* add locales
* exclude other extensions influence