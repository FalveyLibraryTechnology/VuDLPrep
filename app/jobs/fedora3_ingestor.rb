class Fedora3Ingestor
  @queue = :ingests

  def self.perform(dir)
    job = Job.new(dir)
    category = Category.new(File.dirname(dir))

    logger = Logger.new(dir + '/ingest.log')
    logger.info "Beginning ingest."
    if (category.supports_ocr)
      logger.info "OCR supported"
    else
      logger.info "OCR not supported"
    end
    logger.info "Target collection #{category.target_collection_id}"
  end
end