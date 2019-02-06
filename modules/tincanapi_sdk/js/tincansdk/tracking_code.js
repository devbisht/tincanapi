(function (document, tag, id) {
    var js,
        fs = document.getElementsByTagName(tag)[0];

        if (document.getElementById(id))
            return;

        js = document.createElement(tag);
        js.id = id;
        js.src = "#URL#";

        fs.parentNode.insertBefore(js, fs);
})(document, 'script', 'tincansdk');
