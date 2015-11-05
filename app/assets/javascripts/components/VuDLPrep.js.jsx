var VuDLPrep = React.createClass({
    activateJobSelector: function() {
        this.refs.paginator.setState(this.refs.paginator.getInitialState());
        this.refs.selector.show();
    },

    getImageUrl: function(category, job, filename, size) {
        return this.getJobUrl(
            category, job,
            '/' + encodeURIComponent(filename) + '/' + encodeURIComponent(size)
        );
    },

    getJobUrl: function(category, job, extra) {
        return this.props.url + '/' + encodeURIComponent(category) + '/'
            + encodeURIComponent(job) + extra;
    },

    selectJob: function (category, job) {
        this.refs.selector.hide();
        this.refs.paginator.loadJob(category, job);
    },

    render: function() {
        return (
            <div>
                <JobSelector app={this} ref="selector" onJobSelect={this.selectJob} url={this.props.url} />
                <JobPaginator app={this} ref="paginator" />
            </div>
        );
    }
});