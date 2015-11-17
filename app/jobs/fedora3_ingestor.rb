class Fedora3Ingestor
  @queue = :ingests

  def self.perform(dir)
    job = Job.new(dir)
    category = Category.new(File.dirname(dir))

    logger = Logger.new(dir + '/ingest.log')
    logger.info "Beginning ingest."

    holding_area = Fedora3Object.from_pid(category.target_collection_id)
    rels = Fedora3Relsext.new(holding_area.datastream_dissemination('RELS-EXT'))
    if (rels.sort == "custom")
      raise "TODO: implement custom sort support."
    else
      member_position = 0
    end

    resource = Fedora3Object.from_next_pid
    resource.logger = logger
    resource.parent_pid = holding_area.pid
    resource.model_type = "ResourceCollection"
    resource.title = "Incomplete... / Processing..."
    logger.info "Creating Resource Object #{resource.pid}"

    resource.core_ingest("I")
    resource.collection_ingest
    resource.resource_collection_ingest

    if (member_position > 0)
      raise "TODO: deal with ordered collection sequence numbers"
    end

    page_list = Fedora3Object.from_next_pid
    page_list.logger = logger
    page_list.parent_pid = resource.pid
    page_list.model_type = "ListCollection"
    page_list.title = "Page List"
    logger.info "Creating Page List Object #{resource.pid}"

    page_list.core_ingest("I")
    page_list.collection_ingest
    page_list.list_collection_ingest

    logger.info "Done."
  end
end