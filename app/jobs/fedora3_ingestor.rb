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
    logger.info resource.pid
  end
end