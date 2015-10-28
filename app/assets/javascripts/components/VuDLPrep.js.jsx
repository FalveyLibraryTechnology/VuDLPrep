var VuDLPrep = React.createClass({
    componentDidMount: function() {
        VuDLPrepUtils.url = this.props.url;
    },

    selectJob: function (category, job) {
        this.refs.selector.hide();
        this.refs.paginator.setState({active: true});
    },

    render: function() {
        return (
            <div>
                <JobSelector ref="selector" onJobSelect={this.selectJob} url={this.props.url} />
                <JobPaginator ref="paginator" />
            </div>
        );
    }
});