require 'json'
require 'net/http'

class SolrObject < BaseHttpObject 
  
    def initialize()
      @config = Rails.application.config_for(:vudl)
    end

    def query_url
      URI(@config["solr_query_url"])
    end

    def query(params)
        params[:wt] = "json"
      json = do_get query_url, params
      JSON.parse json
    end
end