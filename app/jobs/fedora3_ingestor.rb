require 'fileutils'

class Fedora3Ingestor
  @queue = :ingests

  def self.perform(dir)
    handler = self.new(dir)
    handler.run
  end

  def initialize(dir)
    @job = Job.new(dir)
    @category = Category.new(File.dirname(dir))
    @logger = Logger.new(dir + '/ingest.log')
  end

  def add_datastreams_to_page(page, image_data)
    image = Image.new("#{@job.dir}/#{page.filename}")
    image_data.add_datastream_from_file image.filename, 'MASTER', 'image/tiff'
    image_data.add_master_metadata_datastream
    image.sizes.keys.each do |size|
      image_data.add_datastream_from_file image.derivative(size), size, 'image/jpeg'
    end
    if (@category.supports_ocr)
      image_data.add_datastream_from_file image.ocr, 'OCR-DIRTY', 'text/plain'
    end
  end

  def add_datastreams_to_document(document, document_data)
    document_data.add_datastream_from_file "#{@job.dir}/#{document.filename}", 'MASTER', 'application/pdf'
    document_data.add_master_metadata_datastream
  end

  def add_pages(page_list)
    order = @job.metadata.order.pages
    order.each_with_index do |page, i|
      @logger.info "Adding #{i+1} of #{order.length} - #{page.filename}"
      image_data = build_page page_list, page, i+1
      add_datastreams_to_page page, image_data
    end
  end

  def add_documents(document_list)
    order = @job.metadata.documents.list
    if order.length == 0 && @category.supports_pdf_generation
      @logger.info "Generating PDF"
      order = [Document.new(File.basename(@job.generate_pdf), "PDF")]
    end

    order.each_with_index do |document, i|
      @logger.info "Adding #{i+1} of #{order.length} - #{document.filename}"
      image_data = build_document document_list, document, i+1
      add_datastreams_to_document document, image_data
    end
  end

  def build_page(page_list, page, number)
    image_data = Fedora3Object.from_next_pid
    image_data.logger = @logger
    image_data.parent_pid = page_list.pid
    image_data.model_type = 'ImageData'
    image_data.title = page.label
    @logger.info "Creating Image Object #{image_data.pid}"

    image_data.core_ingest('I')
    image_data.data_ingest
    image_data.image_data_ingest

    image_data.add_sequence_relationship page_list.pid, number

    image_data
  end

  def build_page_list(resource)
    page_list = Fedora3Object.from_next_pid
    page_list.logger = @logger
    page_list.parent_pid = resource.pid
    page_list.model_type = "ListCollection"
    page_list.title = "Page List"
    @logger.info "Creating Page List Object #{resource.pid}"

    page_list.core_ingest("I")
    page_list.collection_ingest
    page_list.list_collection_ingest

    page_list
  end

  def build_document(document_list, document, number)
    document_data = Fedora3Object.from_next_pid
    document_data.logger = @logger
    document_data.parent_pid = document_list.pid
    document_data.model_type = 'PDFData'
    document_data.title = document.label
    @logger.info "Creating Document Object #{document_data.pid}"

    document_data.core_ingest('I')
    document_data.data_ingest
    document_data.document_data_ingest

    document_data.add_sequence_relationship document_list.pid, number

    document_data
  end

  def build_document_list(resource)
    document_list = Fedora3Object.from_next_pid
    document_list.logger = @logger
    document_list.parent_pid = resource.pid
    document_list.model_type = "ListCollection"
    document_list.title = "Document List"
    @logger.info "Creating Document List Object #{resource.pid}"

    document_list.core_ingest("I")
    document_list.collection_ingest
    document_list.list_collection_ingest

    document_list
  end

  def build_resource(holding_area)
    resource = Fedora3Object.from_next_pid
    resource.logger = @logger
    resource.parent_pid = holding_area.pid
    resource.model_type = "ResourceCollection"
    resource.title = "Incomplete... / Processing..."
    @logger.info "Creating Resource Object #{resource.pid}"

    resource.core_ingest("I")
    resource.collection_ingest
    resource.resource_collection_ingest

    # Attach thumbnail to resource:
	if @job.metadata.order.pages.length > 0
	  page = @job.metadata.order.pages[0]
	  image = Image.new("#{@job.dir}/#{page.filename}")
	  resource.add_datastream_from_file image.derivative('THUMBNAIL'), 'THUMBNAIL', 'image/jpeg'
	end
    resource
  end

  def finalize_title resource
    title = @job.dir[1..-1].split('/').reverse.join('_')
    @logger.info "Updating title to #{title}"
    resource.modify_object(
      title,
      nil,
      nil,
      'Set Label to ingest/process path',
      nil
    )

    dc = resource.datastream_dissemination('DC')
    replace_dcmetadata resource, dc.gsub(/Incomplete... \/ Processing.../, title), 'Set dc:title to ingest/process path'
  end

  def replace_dcmetadata resource, dc, message
    @logger.info message
    resource.modify_datastream(
      'DC',
      nil,
      nil,
      nil,
      nil,
      nil,
      nil,
      nil,
      nil,
      'text/xml',
      message,
      nil,
      nil,
      dc
    )
  end

  def move_directory
    config = Rails.application.config_for(:vudl)
    now = Time.new.strftime("%Y-%m-%d")
    target = "#{config["processed_area_path"]}/#{now}/#{@category.name}/#{@job.name}"
    if (File.exist?(target))
      i = 2;
      while (File.exist?("#{target}.#{i}"))
        i += 1
      end
      target = "#{target}.#{i}"
    end
    @logger.info "Moving #{@job.dir} to #{target}"
    FileUtils.mkdir_p target unless File.exist?(target)
    FileUtils.mv Dir.glob("#{@job.dir}/*"), target
    FileUtils.rmdir @job.dir
    FileUtils.rm "#{target}/ingest.lock"
  end

  def run
    start_time = Time.new

    @logger.info "Beginning ingest."

    holding_area = Fedora3Object.from_pid(@category.target_collection_id)
    rels = Fedora3Relsext.new(holding_area.datastream_dissemination('RELS-EXT'))
    if (rels.sort == "custom")
      raise "TODO: implement custom sort support."
    else
      member_position = 0
    end

    resource = build_resource(holding_area)

    if (member_position > 0)
      raise "TODO: deal with ordered collection sequence numbers"
    end

    if @job.metadata.order.pages.length > 0
      page_list = build_page_list(resource)
      add_pages page_list
    end


    if (@job.metadata.documents.list.length > 0 || @category.supports_pdf_generation)
      document_list = build_document_list(resource)
      add_documents document_list
    end

    finalize_title resource

    if @job.metadata.dc.length > 0
      replace_dcmetadata resource, @job.metadata.dc, 'Loading DC XML'
    end

    move_directory

    end_time = Time.new
    duration = (end_time - start_time) / 60

    @logger.info "Done. Total time: #{duration.ceil} minute(s)."
  end
end
