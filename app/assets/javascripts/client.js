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
        var row = $('<div class="row"></div>');
        var leftSide = $('<div class="six col"></div>');
        this.paginatorPreview = $('<div class="preview"></div>');
        leftSide.append(this.paginatorPreview);
        this.paginatorZoomy = $('<canvas id="zoomy"></canvas>');
        this.paginatorZoomy.attr('width', 800);
        this.paginatorZoomy.attr('height', 600);
        this.paginatorZoomy.hide();
        leftSide.append(this.paginatorZoomy);
        var rightSide = $('<div class="six col"></div>');
        this.paginatorControls = this.buildPaginatorControls();
        rightSide.append(this.paginatorControls);
        this.paginatorList = $('<div class="pageList"></div>');
        rightSide.append(this.paginatorList);
        row.append(leftSide);
        row.append(rightSide);
        this.paginator.append(row);
        this.paginator.hide();
        this.container.append(this.paginator);
    },

    buildPaginatorControls: function() {
        var controls = $('<div class="controls"></div>');
        var group = $('<div class="group"></div>');
        this.pageLabelStatus = $('<div class="status"></div>');
        group.append(this.pageLabelStatus);
        this.pageInput = $('<input type="text" id="page" />');
        var that = this;
        this.pageInput.on('change', function () { that.updateCurrentPageLabel(); });
        group.append(this.pageInput);
        var pagePrev = $('<button>Prev</button>');
        pagePrev.click(function() { that.switchPage(-1); })
        var pageNext = $('<button>Next</button>');
        pageNext.click(function() { that.switchPage(1); })
        group.append(pagePrev);
        group.append(pageNext);
        controls.append(group);

        var top = $('<div class="top"></div>');
        this.pageZoomToggle = $('<button>Turn Zoom On</button>');
        this.pageZoomToggle.click(function() { that.toggleZoom(); });
        top.append(this.pageZoomToggle);

        var pageSave = $('<button class="primary">Save</button>');
        pageSave.click(function() { that.savePagination(); });
        top.append(pageSave);
        controls.append(top);

        // Make button groups
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

        var pageConversion = $('<div class="toggles group"></div>');
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

        var autonumberNext = $('<button>Autonumber Following Pages</button>');
        autonumberNext.click(function() { that.autonumberFollowingPages(); });
        controls.append(autonumberNext);

        return controls;
    },

    buildPaginatorControlGroup: function(options, callback) {
        var group = $('<div class="group"></div>');
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
                var currentNumber = $('<div class="number"></div>').text(i + 1);
                currentThumb.append(currentNumber);
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

    autonumberFollowingPages: function() {
        var pages = this.currentPageOrder.length - (this.currentPage + 1);
        var affected = pages - this.countMagicLabels(this.currentPage + 1);
        if (affected > 0) {
            var msg = "You will be clearing " + affected + " label(s). Are you sure?";
            if (!confirm(msg)) {
                return;
            }
        }
        for (var i = this.currentPage + 1; i < this.currentPageOrder.length; i++) {
            this.currentPageOrder[i]['label'] = null;
        }
        this.recalculateMagicLabels();
    },

    countMagicLabels: function(startAt) {
        var count = 0;
        for (var i = startAt; i < this.currentPageOrder.length; i++) {
            if (null === this.currentPageOrder[i]['label']) {
                count++;
            }
        }
        return count;
    },

    saveMagicLabels: function() {
        for (var i = 0; i < this.currentPageOrder.length; i++) {
            if (null === this.currentPageOrder[i]['label']) {
                this.currentPageOrder[i]['label'] = this.getMagicPageLabel(i);
            }
        }
    },

    confirmSavedMagicLabels: function(count) {
        var msg = "You will be saving " + count + " unreviewed, auto-generated"
            + " label(s). Are you sure?";
        return confirm(msg);
    },

    savePagination: function() {
        this.updateCurrentPageLabel();
        var count = this.countMagicLabels(0);
        if (count > 0 && !this.confirmSavedMagicLabels(count)) {
            return;
        }
        this.saveMagicLabels();
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

    adjustNumericLabel: function(prior, delta) {
        // If it's an integer, this is simple:
        if (parseInt(prior) > 0) {
            return parseInt(prior) + delta;
        }
        // Try roman numerals as a last resort.
        try {
            var arabic = RomanNumerals.toArabic(prior);
            var isUpper = (prior == prior.toUpperCase());
            if (arabic > 0) {
                var newLabel = RomanNumerals.toRoman(arabic + delta);
                if (!isUpper) {
                    newLabel = newLabel.toLowerCase();
                }
                return newLabel;
            }
        } catch (e) {
            // Exception thrown! Guess it's not going to work!
        }
        return false;
    },

    getMagicPageLabelFromPrevPage: function(p) {
        var skipRectoCheck = false;
        while (p > 0) {
            var priorLabel = this.parsePageLabel(this.getPageLabel(p - 1));
            if (priorLabel['suffix'] == ', recto' && !skipRectoCheck) {
                priorLabel['suffix'] = ', verso';
                return this.assemblePageLabel(priorLabel);
            }

            var numericLabel = this.adjustNumericLabel(priorLabel['label'], 1);
            if (false !== numericLabel) {
                priorLabel['label'] = numericLabel;
                return this.assemblePageLabel(priorLabel);
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

    getMagicPageLabel: function(p) {
        // Did some experimentation with getMagicPageLabelFromNextPage to
        // complement getMagicPageLabelFromPrevPage, but it winded up having
        // too much recursion and making things too slow.
        return this.getMagicPageLabelFromPrevPage(p);
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
        if (typeof this.listOffset === 'undefined') {
            this.listOffset = this.paginatorList[0].offsetTop + (this.thumbnails[0][0].offsetTop - this.paginatorList[0].offsetTop);
        }
        $('.thumbnail').removeClass('selected');
        this.pageInput.val(this.getPageLabel(p));
        this.thumbnails[p].addClass('selected');
        this.paginatorList[0].scrollTop = this.thumbnails[p][0].offsetTop - this.listOffset;
        this.currentPage = p;
        this.loadPreview(
            this.currentCategory, this.currentJob, this.currentPageOrder[p]['filename']
        );
        this.recalculateMagicLabels();
        this.pageLabelStatus.text(
            "Editing label " + (p + 1) + " of " + this.thumbnails.length
        )
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