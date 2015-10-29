var VuDLPrepUtils = {
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