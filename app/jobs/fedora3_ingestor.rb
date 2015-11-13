class Fedora3Ingestor
  @queue = :ingests

  def self.perform(dir)
    job = Job.new(dir)
    category = Category.new(File.dirname(dir))

    logger = Logger.new(dir + '/ingest.log')
    logger.info "Beginning ingest."
  end
end