var VuDLPrep = {
    init: function (url, container) {
        this.url = url;
        this.container = container;
        this.buildJobSelector();
    },

    buildJobSelector: function () {
        this.jobSelector = $('<div id="jobSelector"></div>');
        this.container.append(this.jobSelector);
        this.fetchJobs(this.jobSelector);
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

    selectJob: function(category, job) {
        console.log(category, job);
    }
};