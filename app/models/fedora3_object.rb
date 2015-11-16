require 'rexml/document'
require 'rexml/xpath'

class Fedora3Object
  attr_accessor :pid

  def initialize()
    @config = Rails.application.config_for(:vudl)
  end

  def self.from_pid(pid)
    obj = Fedora3Object.new
    obj.pid = pid
    obj
  end

  def self.from_next_pid
    obj = Fedora3Object.new
    obj.pid = obj.next_pid
    obj
  end

  def api_base
    @config["fedora3_api"]
  end

  def api_password
    @config["fedora3_password"]
  end

  def api_username
    @config["fedora3_username"]
  end

  def datastream_dissemination(datastream, as_of_data_time = nil, download = nil)
    uri = URI("#{api_base}/objects/#{pid}/datastreams/#{datastream}/content")
    params = { :asOfDataTime => as_of_data_time, :download => download }
    uri.query = URI.encode_www_form(params)
    response = Net::HTTP.get_response(uri)
    response.body
  end

  def namespace
    @config["fedora3_pid_namespace"]
  end

  def next_pid
    uri = URI("#{api_base}/objects/nextPID")
    uri.query = URI.encode_www_form({ 'namespace' => namespace, 'format' => 'xml' })
    req = Net::HTTP::Post.new(uri)
    req.basic_auth api_username, api_password
    response = Net::HTTP.new(uri.host, uri.port).start {|http| http.request(req)}
    xml = REXML::Document.new(response.body)
    ns = { 'management' => 'http://www.fedora.info/definitions/1/0/management/' }
    REXML::XPath.first(xml, "//management:pid[1]/text()", ns)
  end
end