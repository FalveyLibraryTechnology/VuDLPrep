var VuDLPrep = {
    init: function (url, container) {
        this.url = url;
        this.container = container;
        this.pagePrefixes = ['Front ', 'Rear '];
        this.pageLabels = ['cover', 'fly leaf', 'pastedown', 'Frontispiece', 'Plate'];
        this.pageSuffixes = [', recto', ', verso'];
        this.buildJobSelector();
        this.buildPaginator();
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
        var pageNavigation = $('<div class="navigation"></div>');
        var pagePrev = $('<button>Prev</button>');
        pagePrev.click(function() { that.switchPage(-1); })
        pageNavigation.append(pagePrev);
        var pageNext = $('<button>Next</button>');
        pageNext.click(function() { that.switchPage(1); })
        pageNavigation.append(pageNext);
        controls.append(pageNavigation);

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
                        currentItem.append(currentLink);
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
        jQuery.getJSON(this.getJobUrl(category, job, '/pagination'), null, function (data, status) {
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
        var currentImage = $('<img />');
        currentImage.attr(
            'src', this.getImageUrl(category, job, filename, 'medium')
        );
        this.paginatorPreview.empty();
        this.paginatorPreview.append(currentImage);
    },

    savePagination: function() {
        this.updateCurrentPageLabel();
        var that = this;
        $.ajax({
            type: 'PUT',
            url: this.getJobUrl(this.currentCategory, this.currentJob, '/pagination'),
            contentType: 'application/json',
            data: JSON.stringify({ order: this.currentPageOrder }),
            success: function() { alert('Success!'); that.activateJobSelector(); },
            error: function() { alert('Unable to save!'); }
        });
    },

    getMagicPageLabel: function(p) {
        if (p > 0) {
            var priorLabel = this.getPageLabel(p - 1);
            if (parseInt(priorLabel) > 0) {
                return parseInt(priorLabel) + 1;
            }
        }
        return 1;
    },

    getPageLabel: function(p) {
        var label = this.currentPageOrder[p]['label'];
        return (null === label)
            ? this.getMagicPageLabel(p) : label;
    },

    assemblePageLabel: function (label) {
        return label['prefix'] + label['label'] + label['suffix'];
    },

    parsePageLabel: function(text) {
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
            suffix: suffix
        };
    },

    setPagePrefix: function(text) {
        var label = this.parsePageLabel(this.pageInput.val());
        label['prefix'] = text;
        this.pageInput.val(this.assemblePageLabel(label));
    },

    setPageLabel: function(text) {
        var label = this.parsePageLabel(this.pageInput.val());
        label['label'] = text;
        this.pageInput.val(this.assemblePageLabel(label));
    },

    setPageSuffix: function(text) {
        var label = this.parsePageLabel(this.pageInput.val());
        label['suffix'] = text;
        this.pageInput.val(this.assemblePageLabel(label));
    },

    selectPage: function(p) {
        $('.thumbnail').removeClass('selected');
        this.pageInput.val(this.getPageLabel(p));
        this.thumbnails[p].addClass('selected');
        this.currentPage = p;
        this.loadPreview(
            this.currentCategory, this.currentJob, this.currentPageOrder[p]['filename']
        );
    },

    switchPage: function(delta) {
        var newPage = this.currentPage + delta;
        this.updateCurrentPageLabel();
        if (typeof this.currentPageOrder[newPage] !== 'undefined') {
            this.selectPage(newPage);
        }
    },

    updateCurrentPageLabel: function() {
        var label = this.pageInput.val();
        if (label.length == 0) {
            label = null;
        }
        this.currentPageOrder[this.currentPage]['label'] = label;
        this.thumbnails[this.currentPage].find('.label').text(label);
    }
};