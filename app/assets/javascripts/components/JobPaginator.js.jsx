var JobPaginator = React.createClass({
    getImageUrl: function(imageNumber, size) {
        if (typeof this.state.order[imageNumber] === 'undefined') {
            return false;
        }
        filename = this.state.order[imageNumber].filename;
        return this.props.app.getImageUrl(this.state.category, this.state.job, filename, size);
    },

    getStatusUrl: function() {
        return this.props.app.getJobUrl(this.state.category, this.state.job, '/status');
    },

    getLabel: function(imageNumber, useMagic) {
        useMagic = (typeof useMagic === 'undefined') ? true : useMagic;
        var label = (typeof this.state.order[imageNumber] === 'undefined')
            ? null : this.state.order[imageNumber]['label'];
        return (useMagic && null === label)
            ? MagicLabeler.getLabel(imageNumber, this.getLabel) : label;
    },

    setLabel: function(imageNumber, text) {
        var newState = this.state;
        if (text !== null && text.length == 0) {
            text = null;
        }
        newState.order[imageNumber]['label'] = text;
        this.setState(newState);
    },

    autonumberFollowingPages: function() {
        var pages = this.state.order.length - (this.state.currentPage + 1);
        var affected = pages - this.countMagicLabels(this.state.currentPage + 1);
        if (affected > 0) {
            var msg = "You will be clearing " + affected + " label(s). Are you sure?";
            if (!confirm(msg)) {
                return;
            }
        }
        for (var i = this.state.currentPage + 1; i < this.state.order.length; i++) {
            this.setLabel(i, null);
        }
    },

    countMagicLabels: function(startAt) {
        var count = 0;
        for (var i = startAt; i < this.state.order.length; i++) {
            if (null === this.getLabel(i, false)) {
                count++;
            }
        }
        return count;
    },

    getInitialState: function() {
        return {active: false, currentPage: 0, zoom: false, order: []};
    },

    loadJob: function(category, job) {
        jQuery.getJSON(this.props.app.getJobUrl(category, job, ''), null, function (data, status) {
            data.category = category;
            data.job = job;
            data.active = true;
            data.currentPage = 0;
            this.setState(data);
        }.bind(this));
    },

    setPage: function(p) {
        if (p >= 0 && p < this.state.order.length) {
            var newState = this.state;
            newState.currentPage = p;
            this.setState(newState);
        }
    },

    nextPage: function() {
        this.setPage(this.state.currentPage + 1);
    },

    prevPage: function() {
        this.setPage(this.state.currentPage - 1);
    },

    saveMagicLabels: function() {
        for (var i = 0; i < this.state.order.length; i++) {
            if (null === this.getLabel(i, false)) {
                this.setLabel(i, this.getLabel(i));
            }
        }
    },

    confirmSavedMagicLabels: function(count) {
        var msg = "You will be saving " + count + " unreviewed, auto-generated"
            + " label(s). Are you sure?";
        return confirm(msg);
    },

    save: function(publish) {
        var count = this.countMagicLabels(0);
        if (count > 0 && !this.confirmSavedMagicLabels(count)) {
            return;
        }
        this.saveMagicLabels();
        var promise = new Promise(function(resolve, reject) {
            // If the user wants to publish, let's make sure all derivatives are
            // ready! Otherwise we can resolve with no further actions.
            if (publish) {
                jQuery.getJSON(this.getStatusUrl(), null, function (data) {
                    resolve(data);
                }.bind(this));
            } else {
                resolve(null);
            }
        }.bind(this));
        promise.then(function(data) {
            if (publish) {
                if (data.derivatives.expected > data.derivatives.processed) {
                    var msg = "Derivative images have not been generated yet. Please"
                        + " go back to the main menu and hit the \"build\" button"
                        + " for this job before publishing it.";
                    alert(msg);
                    return;
                }
                var msg = "Are you sure you wish to publish this job? You will not be able"
                    + " to make any further edits."
                if (!confirm(msg)) {
                    return;
                }
            }
            $.ajax({
                type: 'PUT',
                url: this.props.app.getJobUrl(this.state.category, this.state.job, ''),
                contentType: 'application/json',
                data: JSON.stringify({ order: this.state.order, published: publish }),
                success: function() { alert('Success!'); this.props.app.activateJobSelector(); }.bind(this),
                error: function() { alert('Unable to save!'); }
            });
        }.bind(this));
    },

    toggleZoom: function() {
        newState = this.state;
        newState.zoom = !newState.zoom;
        this.setState(newState);
    },

    render: function() {
        var preview = this.state.zoom
            ? <PaginatorZoomy img={this.getImageUrl(this.state.currentPage, 'large')} />
            : <PaginatorPreview img={this.getImageUrl(this.state.currentPage, 'medium')} />
        return (
            <div className={this.state.active ? '' : 'hidden'} id="paginator">
                <div className="row">
                    <div className="six col">{preview}</div>
                    <div className="six col">
                        <PaginatorControls paginator={this} />
                        <PaginatorList paginator={this} pageCount={this.state.order.length} />
                    </div>
                </div>
            </div>
        );
    }
});

var PaginatorPreview = React.createClass({
    render: function() {
        var img = this.props.img
            ? <img src={this.props.img} />
            : '';
        return (
            <div className="preview">
                {img}
            </div>
        );
    }
});

var PaginatorZoomy = React.createClass({
    componentDidMount: function() {
        Zoomy.init(document.getElementById('zoomy'));
        this.componentDidUpdate();
    },

    componentDidUpdate: function() {
        Zoomy.load(
            this.props.img,
            function() {
                Zoomy.resize();
                Zoomy.center();
                $(this.refs.status).hide();
            }.bind(this)
        );
    },

    render: function() {
        return (
            <div>
                <div ref="status" id="zoomyStatus">Loading...</div>
                <canvas id="zoomy"></canvas>
            </div>
        );
    }
});

var PaginatorControls = React.createClass({
    getLabel: function(useMagic) {
        if (typeof useMagic === 'undefined') {
            useMagic = true;
        }
        var label = $(this.refs.labelInput).val();
        return (label.length == 0 && useMagic)
            ? this.props.paginator.getLabel(this.props.paginator.state.currentPage)
            : label;
    },

    setLabel: function(label) {
        this.props.paginator.setLabel(this.props.paginator.state.currentPage, label);
    },

    setLabelPrefix: function(str) {
        this.setLabel(
            MagicLabeler.replaceLabelPart(this.getLabel(), 'prefix', str, true)
        );
    },

    setLabelBody: function(str) {
        this.setLabel(
            MagicLabeler.replaceLabelPart(this.getLabel(), 'label', str)
        );
    },

    setLabelSuffix: function(str) {
        this.setLabel(
            MagicLabeler.replaceLabelPart(this.getLabel(), 'suffix', str, true)
        );
    },

    toggleBrackets: function() {
        this.setLabel(MagicLabeler.toggleBrackets(this.getLabel()));
    },

    toggleCase: function() {
        this.setLabel(MagicLabeler.toggleCase(this.getLabel()));
    },

    toggleRoman: function() {
        var label = MagicLabeler.toggleRoman(this.getLabel());
        if (label === false) {
            return alert("Roman numeral toggle not supported for this label.");
        }
        this.setLabel(label);
    },

    updateCurrentPageLabel: function() {
        this.setLabel(this.getLabel(false));
    },

    render: function() {
        return (
            <div className="controls">
                <div className="group">
                    <div className="status"></div>
                    <input type="text" value={this.props.paginator.getLabel(this.props.paginator.state.currentPage, false)} ref="labelInput" id="page" onChange={this.updateCurrentPageLabel} />
                    <button onClick={this.props.paginator.prevPage}>Prev</button>
                    <button onClick={this.props.paginator.nextPage}>Next</button>
                </div>
                <div className="top">
                    <ZoomToggleButton paginator={this.props.paginator} />
                    <button className="primary" onClick={function() { this.props.paginator.save(false); }.bind(this)}>Save</button>
                    <button className="primary" onClick={function() { this.props.paginator.save(true); }.bind(this)}>Save and Publish</button>
                </div>
                <PaginatorControlGroup callback={this.setLabelPrefix}>{MagicLabeler.prefixes}</PaginatorControlGroup>
                <PaginatorControlGroup callback={this.setLabelBody}>{MagicLabeler.labels}</PaginatorControlGroup>
                <PaginatorControlGroup callback={this.setLabelSuffix}>{MagicLabeler.suffixes}</PaginatorControlGroup>
                <div className="toggles group">
                    <button onClick={this.toggleBrackets}>Toggle []</button>
                    <button onClick={this.toggleCase}>Toggle Case</button>
                    <button onClick={this.toggleRoman}>Toggle Roman Numerals</button>
                </div>
                <button onClick={this.props.paginator.autonumberFollowingPages}>Autonumber Following Pages</button>
            </div>
        );
    }
});

var PaginatorControlGroup = React.createClass({
    render: function() {
        var buttons = this.props.children.map(function (item) {
            var callback = function() {
                this.props.callback(item);
            }.bind(this);
            return (
                <button onClick={callback} key={item}>{item}</button>
            );
        }.bind(this));
        return (
            <div className="group">{buttons}</div>
        );
    }
});

var PaginatorList = React.createClass({
    scrollTo: function(thumb) {
        var listOffset =
            this.refs.pageList.offsetTop +
            (this.refs.thumb0.refs.wrapper.offsetTop - this.refs.pageList.offsetTop);
        this.refs.pageList.scrollTop = thumb.offsetTop - listOffset;
    },

    render: function() {
        var pages = [];
        for (var i = 0; i < this.props.pageCount; i++) {
            pages[i] = <Thumbnail ref={"thumb" + i} list={this} selected={i === this.props.paginator.state.currentPage} paginator={this.props.paginator} key={i} number={i} />;
        };
        return (
            <div ref="pageList" className="pageList">{pages}</div>
        );
    }
});

var Thumbnail = React.createClass({
    selectPage: function() {
        this.props.paginator.setPage(this.props.number);
    },

    componentDidUpdate: function() {
        if (this.props.selected) {
            this.props.list.scrollTo(this.refs.wrapper);
        }
    },

    render: function() {
        var label = this.props.paginator.getLabel(this.props.number);
        // check for magic labels:
        var labelClass = 'label' +
            (null === this.props.paginator.getLabel(this.props.number, false) ? ' magic' : '');
        var myClass = 'thumbnail' + (this.props.selected ? ' selected' : '');
        return (
            <div onClick={this.selectPage} className={myClass} ref="wrapper">
                <img src={this.props.paginator.getImageUrl(this.props.number, 'thumb')} />
                <div className="number">{this.props.number + 1}</div>
                <div className={labelClass}>{label}</div>
            </div>
        );
    }
});

var ZoomToggleButton = React.createClass({
    render: function() {
        return (
            <button onClick={this.props.paginator.toggleZoom}>{this.props.paginator.state.zoom ? 'Turn Zoom Off' : 'Turn Zoom On'}</button>
        );
    }
});