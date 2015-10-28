var JobPaginator = React.createClass({
    getInitialState: function() {
        return {active: false};
    },

    render: function() {
        return (
            <div className={this.state.active ? '' : 'hidden'}>TODO: Paginator</div>
        );
    }
});
