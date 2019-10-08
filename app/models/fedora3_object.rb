require 'net/http'
require 'rexml/document'
require 'rexml/xpath'

class Fedora3Object < BaseHttpObject 
  attr_accessor :model_type, :parent_pid, :pid, :title

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

  def add_datastream(ds_id, control_group, ds_location, alt_ids, ds_label, versionable, ds_state, format_uri, checksum_type, checksum, mime_type, log_message, data)
    log "Adding datastream #{ds_id} to #{pid}"
    uri = URI("#{api_base}/objects/#{pid}/datastreams/#{ds_id}")
    params = {
      controlGroup: control_group,
      dsLocation: ds_location,
      altIDs: alt_ids,
      dsLabel: ds_label,
      versionable: versionable,
      dsState: ds_state,
      formatURI: format_uri,
      checksumType: checksum_type,
      checksum: checksum_type == 'DISABLED' ? nil : checksum,
      mimeType: mime_type,
      logMessage: log_message
    }
    uri.query = URI.encode_www_form(params.compact)
    response = do_post(uri, data, mime_type)
  end

  def add_datastream_from_file(filename, stream, mime_type)
    contents = File.open(filename, 'rb').read
    if (mime_type == "text/plain" && contents.length == 0)
      contents = "\n" # workaround for 500 error on empty OCR
    end
    add_datastream(
      stream,
      'M',
      nil,
      nil,
      "#{self.pid.tr(':', '_')}_#{stream}",
      'false',
      'A',
      nil,
      'MD5',
      nil,
      mime_type,
      "Initial Ingest addDatastream - #{stream}",
      contents
    )
  end

  def add_datastream_from_string(contents, stream, mime_type)
    if (mime_type == "text/plain" && contents.length == 0)
      contents = "\n" # workaround for 500 error on empty OCR
    end
    add_datastream(
      stream,
      'M',
      nil,
      nil,
      "#{self.pid.tr(':', '_')}_#{stream}",
      'false',
      'A',
      nil,
      'MD5',
      nil,
      mime_type,
      "Initial Ingest addDatastream - #{stream}",
      contents
    )
  end

  def add_master_metadata_datastream
    add_datastream(
      'MASTER-MD',
      'M',
      nil,
      nil,
      "#{self.pid.tr(':', '_')}_MASTER-MD",
      'false',
      'A',
      nil,
      'DISABLED',
      nil,
      'text/xml',
      'Initial Ingest addDatastream - MASTER-MD',
      fits_master_metadata
    )
  end

  def add_relationship(subject, predicate, object, is_literal, datatype)
    log "Adding relationship #{subject} #{predicate} #{object} to #{pid}"
    uri = URI("#{api_base}/objects/#{pid}/relationships/new")
    params = {
      subject: subject,
      predicate: predicate,
      object: object,
      isLiteral: is_literal,
      datatype: datatype
    }
    uri.query = URI.encode_www_form(params.compact)
    response = do_post(uri)
  end

  def add_model_relationship(model)
    add_relationship(
      "info:fedora/#{pid}",
      'info:fedora/fedora-system:def/model#hasModel',
      "info:fedora/vudl-system:#{model}",
      'false',
      nil
    )
  end

  def add_sequence_relationship(parent_pid, position)
    add_relationship(
      "info:fedora/#{pid}",
      'http://vudl.org/relationships#sequence',
      "#{parent_pid}##{position}",
      'true',
      nil
    )
  end

  def add_sort_relationship(sort)
    add_relationship(
      "info:fedora/#{pid}",
      'http://vudl.org/relationships#sortOn',
      sort,
      'true',
      nil
    )
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

  def collection_ingest
    log "Collection ingest for #{pid}"
    add_model_relationship 'CollectionModel'
    add_datastream(
      'MEMBER-QUERY',
      'E',
      "http://local.fedora.server/fedora/objects/#{pid}/methods/vudl-system:CollectionModelService/generateMemberQuery",
      nil,
      'Query to list members', 
      'false', 
      'A', 
      nil, 
      'DISABLED', 
      'none', 
      'text/plain', 
      'Initial Ingest addDatastream - MEMBER-QUERY',
      nil
    )
    add_datastream(
      'MEMBER-LIST-RAW',
      'E',
      "http://local.fedora.server/fedora/objects/#{pid}/methods/vudl-system:CollectionModelService/executeMemberQuery",
      nil,
      'Unformatted list of Members', 
      'false', 
      'A', 
      nil, 
      'DISABLED', 
      'none', 
      'text/xml', 
      'Initial Ingest addDatastream - MEMBER-LIST-RAW',
      nil
    )
  end

  def core_ingest(object_state)
    log "Core ingest for #{pid}"
    ingest(
      title,
      'info:fedora/fedora-system:FOXML-1.1',
      'UTF-8',
      namespace,
      'diglibEditor',
      "#{title} - ingest",
      'false'
    )
    modify_object(nil, nil, object_state, 'Set initial state', nil)
    add_model_relationship 'CoreModel'
    add_relationship(
      "info:fedora/#{pid}",
      'info:fedora/fedora-system:def/relations-external#isMemberOf',
      "info:fedora/#{parent_pid}",
      'false',
      nil
    )
    add_datastream(
      'PARENT-QUERY',
      'E',
      "http://local.fedora.server/fedora/objects/#{pid}/methods/vudl-system:CoreModelService/generateParentQuery",
      nil,
      'Query to list Parents', 
      'false', 
      'A', 
      nil, 
      'DISABLED', 
      'none', 
      'text/plain', 
      'Initial Ingest addDatastream - PARENT-QUERY',
      nil
    )
    add_datastream(
      'PARENT-LIST-RAW',
      'E',
      "http://local.fedora.server/fedora/objects/#{pid}/methods/vudl-system:CoreModelService/executeParentQuery",
      nil,
      'Unformatted list of Parents', 
      'false', 
      'A', 
      nil, 
      'DISABLED', 
      'none', 
      'text/xml', 
      'Initial Ingest addDatastream - PARENT-LIST-RAW',
      nil
    )
    add_datastream(
      'PARENT-LIST',
      'E',
      "http://local.fedora.server/fedora/objects/#{pid}/methods/vudl-system:CoreModelService/formatParentQueryResult",
      nil,
      'XML list of parents grouped by multiple paths', 
      'false', 
      'A', 
      nil, 
      'DISABLED', 
      'none', 
      'text/xml', 
      'Initial Ingest addDatastream - PARENT-LIST',
      nil
    )
  end

  def data_ingest
    add_model_relationship 'DataModel'
  end

  def datastream_dissemination(datastream, as_of_data_time = nil, download = nil)
    uri = URI("#{api_base}/objects/#{pid}/datastreams/#{datastream}/content")
    params = { :asOfDataTime => as_of_data_time, :download => download }
    do_get uri, params
  end

  def fits_master_metadata
    uri = URI(fits_base)
    master_content_url = "#{api_base}/objects/#{pid}/datastreams/MASTER/content"
    params = { :url => master_content_url, :resultFormat => nil }
    do_get uri, params
  end

  def fits_base
    "#{@config['fedora3_host']}/fits/fits"
  end

  def image_data_ingest
    add_model_relationship 'ImageData'
  end

  def document_data_ingest
    add_model_relationship 'PDFData'
  end

  def ingest(label, format, encoding, namespace, owner_id, log_message, ignore_mime, xml = nil)
    params = {
      label: label,
      format: format,
      encoding: encoding,
      namespace: namespace,
      ownerId: owner_id,
      logMessage: log_message,
      ignoreMime: ignore_mime
    }
    target_pid = xml ? "new" : pid
    log "Ingest for #{target_pid}"
    uri = URI("#{api_base}/objects/#{target_pid}")
    uri.query = URI.encode_www_form(params.compact)
    response = do_post(uri, xml, 'text/xml')
  end

  def list_collection_ingest
    add_model_relationship 'ListCollection'
    add_sort_relationship 'custom'
  end

  def modify_datastream(ds_id, ds_location, alt_ids, ds_label, versionable, ds_state, format_uri, checksum_type, checksum, mime_type, log_message, ignore_content, last_modified_date, data)
    log "Updating datastream #{ds_id} on #{pid}"
    uri = URI("#{api_base}/objects/#{pid}/datastreams/#{ds_id}")
    params = {
      dsLocation: ds_location,
      altIDs: alt_ids,
      dsLabel: ds_label,
      versionable: versionable,
      dsState: ds_state,
      formatURI: format_uri,
      checksumType: checksum_type,
      checksum: checksum_type == 'DISABLED' ? nil : checksum,
      mimeType: mime_type,
      logMessage: log_message,
      ignoreContent: ignore_content,
      lastModifiedDate: last_modified_date
    }
    uri.query = URI.encode_www_form(params.compact)
    response = do_put(uri, data, mime_type)
  end

  def modify_object(label, owner_id, state, log_message, last_modified_date)
    log "Modifying #{pid}"
    uri = URI("#{api_base}/objects/#{pid}")
    params = {
      label: label,
      ownerId: owner_id,
      state: state,
      logMessage: log_message,
      lastModifiedDate: last_modified_date
    }
    uri.query = URI.encode_www_form(params.compact)
    response = do_put(uri, nil, 'text/xml')
  end

  def namespace
    @config["fedora3_pid_namespace"]
  end

  def next_pid
    uri = URI("#{api_base}/objects/nextPID")
    uri.query = URI.encode_www_form({ 'namespace' => namespace, 'format' => 'xml' })
    response = do_post(uri)
    xml = REXML::Document.new(response.body)
    ns = { 'management' => 'http://www.fedora.info/definitions/1/0/management/' }
    REXML::XPath.first(xml, "//management:pid[1]/text()", ns).to_s
  end

  def resource_collection_ingest(raw_resource = nil, license_str = nil, agents = nil, process_md = nil)
    log "Resource collection ingest for #{pid}"
    add_model_relationship 'ResourceCollection'
    add_sort_relationship 'title'
    if (raw_resource)
      raise "TODO: support raw_resource parameter"
    end
    if (license_str)
      raise "TODO: support license_str parameter"
    end
    if (agents)
      raise "TODO: support raise parameter"
    end
    if (process_md)
      raise "TODO: support process_md parameter"
    end
  end
end