var VuDLPrep = {
    init: function (url, container) {
        this.url = url;
        this.zoom = false;
        this.container = container;
        this.pagePrefixes = ['Front ', 'Rear '];
        this.pageLabels = ['Blank', 'cover', 'fly leaf', 'pastedown', 'Frontispiece', 'Plate'];
        this.pageSuffixes = [', recto', ', verso'];
        this.buildJobSelector();
        this.buildPaginator();
        Zoomy.init(document.getElementById('zoomy'));
    },

    buildJobSelector: function () {
        this.jobSelector = $('<div id="jobSelector"></div>');
        this.container.append(this.jobSelector);
        this.fetchJobs(this.jobSelector);
    },

    buildPaginator: function() {
        this.paginator = $('<div id="paginator"></div>');
        this.paginatorList = $('<div class="pageList"></div>');
        this.paginator.append(this.paginatorList);
        this.paginatorPreview = $('<div class="preview"></div>');
        this.paginator.append(this.paginatorPreview);
        this.paginatorZoomy = $('<canvas id="zoomy"></canvas>');
        this.paginatorZoomy.attr('width', 800);
        this.paginatorZoomy.attr('height', 600);
        this.paginatorZoomy.hide();
        this.paginator.append(this.paginatorZoomy);
        this.paginatorControls = this.buildPaginatorControls();
        this.paginator.append(this.paginatorControls);
        this.paginator.hide();
        this.container.append(this.paginator);
    },

    buildPaginatorControls: function() {
        var controls = $('<div class="controls"></div>');
        this.pageInput = $('<input type="text" id="page" />');
        var that = this;
        this.pageInput.on('change', function () { that.updateCurrentPageLabel(); });
        controls.append(this.pageInput);

        var prefixGroup = this.buildPaginatorControlGroup(
            this.pagePrefixes, function (t) { that.setPagePrefix(t); }
        );
        controls.append(prefixGroup);
        var labelGroup = this.buildPaginatorControlGroup(
            this.pageLabels, function (t) { that.setPageLabel(t); }
        );
        controls.append(labelGroup);
        var suffixGroup = this.buildPaginatorControlGroup(
            this.pageSuffixes, function (t) { that.setPageSuffix(t); }
        );
        controls.append(suffixGroup);
        var pageConversion = $('<div class="toggles"></div>');
        var toggleBrackets = $('<button>Toggle []</button>');
        toggleBrackets.click(function() { that.toggleBrackets(); });
        pageConversion.append(toggleBrackets);
        var toggleCase = $('<button>Toggle Case</button>');
        toggleCase.click(function() { that.toggleCase(); });
        pageConversion.append(toggleCase);
        var toggleRoman = $('<button>Toggle Roman Numerals</button>');
        toggleRoman.click(function() { that.toggleRoman(); });
        pageConversion.append(toggleRoman);
        controls.append(pageConversion);
        var pageNavigation = $('<div class="navigation"></div>');
        var pagePrev = $('<button>Prev</button>');
        pagePrev.click(function() { that.switchPage(-1); })
        pageNavigation.append(pagePrev);
        var pageNext = $('<button>Next</button>');
        pageNext.click(function() { that.switchPage(1); })
        pageNavigation.append(pageNext);
        controls.append(pageNavigation);

        this.pageZoomToggle = $('<button>Turn Zoom On</button>');
        this.pageZoomToggle.click(function() { that.toggleZoom(); });
        controls.append(this.pageZoomToggle);

        var pageSave = $('<button>Save</button>');
        pageSave.click(function() { that.savePagination(); });
        controls.append(pageSave);
        return controls;
    },

    buildPaginatorControlGroup: function(options, callback) {
        var group = $('<div class="controlGroup"></div>');
        for (var i = 0; i < options.length; i++) {
            var current = $('<button />').text(options[i]);
            current.click(function () { callback($(this).text()) });
            group.append(current);
        }
        return group;
    },

    fetchJobs: function(target) {
        var that = this;
        jQuery.getJSON(this.url, null, function (data, status) {
            target.empty();
            for (var i = 0 ; i < data.length; i++) {
                var current = data[i];
                var currentCategory = current['category'];
                if (current['jobs'].length > 0) {
                    var currentElement = $('<div class="jobCategory"></div>');
                    currentElement.append($('<h2></h2>').text(currentCategory));
                    var currentList = $('<ul></ul>');
                    currentElement.append(currentList);
                    for (var j = 0; j < current['jobs'].length; j++) {
                        var currentItem = $('<li></li>');
                        var currentJob = current['jobs'][j];
                        var currentLink = $('<a href="#" />').text(currentJob);
                        currentLink.click(
                            that.getJobSelector(currentCategory, currentJob)
                        );
                        var currentStatus = $("<span> checking...</span>");
                        that.updateJobDerivativeStatus(
                            currentCategory, currentJob, currentStatus
                        );
                        currentItem.append(currentLink);
                        currentItem.append(currentStatus);
                        currentList.append(currentItem);
                    }
                    target.append(currentElement);
                }
            }
        });
    },

    getJobSelector: function(category, job) {
        var that = this;
        return function () {
            return that.selectJob(category, job);
        }
    },

    updateJobDerivativeStatus: function(category, job, element) {
        var that = this;
        var derivUrl = this.getJobUrl(category, job, '/derivatives');
        jQuery.getJSON(derivUrl, null, function (data) {
            element.empty();
            var addLinks, status;
            if (data['expected'] === data['processed']) {
                status = " [ready]";
                addLinks = false;
            } else {
                status = " [derivatives: " + data['processed'] + "/" + data['expected'] + "] ";
                addLinks = true;
            }
            element.empty().text(status);
            if (addLinks) {
                var refresh = $('<a href="#">[refresh]</a>');
                refresh.click(function() {
                    element.empty().text(' checking...');
                    that.updateJobDerivativeStatus(category, job, element);
                });
                var build = $('<a href="#">[build]</a>');
                build.click(function() {
                    element.empty().text(' triggering...');
                    $.ajax({
                        type: 'PUT',
                        url: derivUrl,
                        contentType: 'application/json',
                        data: '{}',
                        success: function() { that.updateJobDerivativeStatus(category, job, element); },
                        error: function() { element.empty().text(' failed!'); }
                    });
                    that.updateJobDerivativeStatus(category, job, element);
                });
                element.append(refresh);
                element.append(build);
            }
        });
    },

    getPageSelector: function(p) {
        var that = this;
        return function () {
            return that.selectPage(p);
        }
    },

    activateJobSelector: function() {
        this.jobSelector.show();
        this.paginator.hide();
    },

    selectJob: function(category, job) {
        this.currentCategory = category;
        this.currentJob = job;
        this.jobSelector.hide();
        this.paginator.show();

        this.loadPageList(category, job, this.paginatorList);
    },

    getImageUrl: function(category, job, filename, size) {
        return this.getJobUrl(
            category, job,
            '/' + encodeURIComponent(filename) + '/' + encodeURIComponent(size)
        );
    },

    getJobUrl: function(category, job, extra) {
        return this.url + '/' + encodeURIComponent(category) + '/'
            + encodeURIComponent(job) + extra;
    },

    loadPageList: function(category, job, target) {
        var that = this;
        target.empty();
        jQuery.getJSON(this.getJobUrl(category, job, ''), null, function (data, status) {
            that.currentPageOrder = data['order'];
            that.thumbnails = [];
            for (var i = 0; i < data['order'].length; i++) {
                var currentThumb = $('<div class="thumbnail"></div>');
                currentThumb.click(that.getPageSelector(i));
                var currentImage = $('<img />');
                currentImage.attr('src', that.getImageUrl(category, job, data['order'][i]['filename'], 'thumb'))
                currentThumb.append(currentImage);
                var currentLabel = $('<div class="label"></div>').text(data['order'][i]['label']);
                currentThumb.append(currentLabel);
                target.append(currentThumb);
                that.thumbnails[i] = currentThumb;
            }
            that.selectPage(0);
        });
    },

    loadPreview: function(category, job, filename) {
        if (this.zoom) {
            var large = this.getImageUrl(category, job, filename, 'large');
            Zoomy.load(large);
        } else {
            var currentImage = $('<img />');
            currentImage.attr(
                'src', this.getImageUrl(category, job, filename, 'medium')
            );
            this.paginatorPreview.empty();
            this.paginatorPreview.append(currentImage);
        }
    },

    savePagination: function() {
        this.updateCurrentPageLabel();
        var that = this;
        $.ajax({
            type: 'PUT',
            url: this.getJobUrl(this.currentCategory, this.currentJob, ''),
            contentType: 'application/json',
            data: JSON.stringify({ order: this.currentPageOrder }),
            success: function() { alert('Success!'); that.activateJobSelector(); },
            error: function() { alert('Unable to save!'); }
        });
    },

    getMagicPageLabel: function(p) {
        var skipRectoCheck = false;
        while (p > 0) {
            var priorLabel = this.parsePageLabel(this.getPageLabel(p - 1));
            if (priorLabel['suffix'] == ', recto' && !skipRectoCheck) {
                priorLabel['suffix'] = ', verso';
                return this.assemblePageLabel(priorLabel);
            }
            if (parseInt(priorLabel['label']) > 0) {
                priorLabel['label'] = parseInt(priorLabel['label']) + 1;
                return this.assemblePageLabel(priorLabel);
            }
            // Try roman numerals as a last resort.
            try {
                var arabic = RomanNumerals.toArabic(priorLabel['label']);
                var isUpper = (priorLabel['label'] == priorLabel['label'].toUpperCase());
                if (arabic > 0) {
                    priorLabel['label'] = RomanNumerals.toRoman(arabic + 1);
                    if (!isUpper) {
                        priorLabel['label'] = priorLabel['label'].toLowerCase();
                    }
                    return this.assemblePageLabel(priorLabel);
                }
            } catch (e) {
                // Exception thrown! Guess it's not going to work!
            }

            // If we couldn't determine a label based on the previous page,
            // let's go back deeper... however, when doing this deeper search,
            // we don't want to repeat the recto/verso check since that will
            // cause bad results.
            p--;
            skipRectoCheck = true;
        }
        return 1;
    },

    getPageLabel: function(p) {
        var label = this.currentPageOrder[p]['label'];
        return (null === label)
            ? this.getMagicPageLabel(p) : label;
    },

    assemblePageLabel: function (label) {
        var text = label['prefix'] + label['label'] + label['suffix'];
        return label['brackets'] ? '[' + text + ']' : text;
    },

    parsePageLabel: function(text) {
        var brackets = false;
        text = new String(text);
        if (text.substring(0, 1) == '[' && text.substring(text.length - 1, text.length) == ']') {
            text = text.substring(1, text.length - 1);
            brackets = true;
        }
        var prefix = '';
        for (var i = 0; i < this.pagePrefixes.length; i++) {
            var currentPrefix = this.pagePrefixes[i];
            if (text.substring(0, currentPrefix.length) == currentPrefix) {
                prefix = currentPrefix;
                text = text.substring(currentPrefix.length);
                break;
            }
        }
        var suffix = '';
        for (var i = 0; i < this.pageSuffixes.length; i++) {
            var currentSuffix = this.pageSuffixes[i];
            if (text.substring(text.length - currentSuffix.length) == currentSuffix) {
                suffix = currentSuffix;
                text = text.substring(0, text.length - currentSuffix.length);
                break;
            }
        }
        var label = text;
        return {
            prefix: prefix,
            label: label,
            suffix: suffix,
            brackets: brackets
        };
    },

    recalculateMagicLabels: function() {
        for (var i = 0; i < this.currentPageOrder.length; i++) {
            if (null === this.currentPageOrder[i]['label']) {
                var label = $('<i></i>');
                label.text(this.getMagicPageLabel(i))
                this.thumbnails[i].find('.label').empty().append(label);
            }
        }
    },

    setPagePrefix: function(text) {
        var label = this.parsePageLabel(this.pageInput.val());
        label['prefix'] = (label['prefix'] == text) ? '' : text;
        this.pageInput.val(this.assemblePageLabel(label));
        this.updateCurrentPageLabel();
    },

    setPageLabel: function(text) {
        var label = this.parsePageLabel(this.pageInput.val());
        label['label'] = text;
        this.pageInput.val(this.assemblePageLabel(label));
        this.updateCurrentPageLabel();
    },

    setPageSuffix: function(text) {
        var label = this.parsePageLabel(this.pageInput.val());
        label['suffix'] = (label['suffix'] == text) ? '' : text;
        this.pageInput.val(this.assemblePageLabel(label));
        this.updateCurrentPageLabel();
    },

    toggleBrackets: function() {
        var label = this.parsePageLabel(this.pageInput.val());
        label['brackets'] = !label['brackets'];
        this.pageInput.val(this.assemblePageLabel(label));
        this.updateCurrentPageLabel();
    },

    toggleCase: function() {
        var label = this.pageInput.val();
        if (label == label.toLowerCase()) {
            label = label.toUpperCase();
        } else {
            label = label.toLowerCase();
        }
        this.pageInput.val(label);
        this.updateCurrentPageLabel();
    },

    toggleRoman: function() {
        var label = this.parsePageLabel(this.pageInput.val());
        if (parseInt(label['label']) > 0) {
            label['label'] = RomanNumerals.toRoman(label['label']);
        } else {
            try {
                label['label'] = RomanNumerals.toArabic(label['label']);
            } catch (e) {
                alert('Cannot convert current value.');
            }
        }
        this.pageInput.val(this.assemblePageLabel(label));
        this.updateCurrentPageLabel();
    },

    selectPage: function(p) {
        $('.thumbnail').removeClass('selected');
        this.pageInput.val(this.getPageLabel(p));
        this.thumbnails[p].addClass('selected');
        this.thumbnails[p].get(0).scrollIntoView();
        this.currentPage = p;
        this.loadPreview(
            this.currentCategory, this.currentJob, this.currentPageOrder[p]['filename']
        );
        this.recalculateMagicLabels();
    },

    switchPage: function(delta) {
        var newPage = this.currentPage + delta;
        this.updateCurrentPageLabel();
        if (typeof this.currentPageOrder[newPage] !== 'undefined') {
            this.selectPage(newPage);
        }
    },

    toggleZoom: function() {
        this.zoom = !this.zoom;
        if (this.zoom) {
            this.paginatorZoomy.show();
            this.paginatorPreview.hide();
            this.pageZoomToggle.text('Turn Zoom Off');
        } else {
            this.paginatorZoomy.hide();
            this.paginatorPreview.show();
            this.pageZoomToggle.text('Turn Zoom On');
        }
        this.loadPreview(
            this.currentCategory, this.currentJob,
            this.currentPageOrder[this.currentPage]['filename']
        );
    },

    updateCurrentPageLabel: function() {
        var label = this.pageInput.val();
        if (label.length == 0) {
            label = null;
        }
        this.currentPageOrder[this.currentPage]['label'] = label;
        this.thumbnails[this.currentPage].find('.label').empty().text(label);
        this.recalculateMagicLabels();
    }
};