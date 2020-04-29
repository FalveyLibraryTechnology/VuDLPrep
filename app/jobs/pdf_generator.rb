require 'json'
require 'net/http'
require 'rmagick'

class PdfGenerator
    @queue = :ingests

    def self.perform(pid)
      manifest_url = self.config['vufind_url'].to_s + "/Item/" + pid + "/Manifest"
      json = self.do_get manifest_url
      parsed_json = JSON.parse json
      unless (self.has_pdf_already parsed_json)
        large_jpegs = parsed_json["sequences"][0]["canvases"].map do |current|
          current["images"][0]["resource"]["@id"]
        end
        pdf = self.generate_pdf(large_jpegs)
        self.add_pdf_to_pid(pdf,pid)
        File.delete(pdf)
      end
    end

    def self.has_pdf_already(parsed_json)
      unless (parsed_json["sequences"][0]["rendering"])
        return false
      end
      rendering_format = parsed_json["sequences"][0]["rendering"].map do |current|
        current["format"]
      end
      rendering_format.include? "application/pdf"
    end

    def self.add_pdf_to_pid(pdf,pid)
      resource = Fedora3Object.from_pid pid
      document_list = Fedora3Object.from_next_pid
      document_list.parent_pid = resource.pid
      document_list.model_type = "ListCollection"
      document_list.title = "Document List"
      document_list.core_ingest("I")
      document_list.collection_ingest
      document_list.list_collection_ingest
      image_data = self.build_document document_list, pdf, 1
      self.add_datastreams_to_document pdf, image_data
    end

    def self.build_document(document_list, document, number)
      document_data = Fedora3Object.from_next_pid
      document_data.logger = @logger
      document_data.parent_pid = document_list.pid
      document_data.model_type = 'PDFData'
      document_data.title = "PDF"
      document_data.core_ingest('I')
      document_data.data_ingest
      document_data.document_data_ingest
      document_data.add_sequence_relationship document_list.pid, number
      document_data
    end

    def self.add_datastreams_to_document(document, document_data)
      document_data.add_datastream_from_file document, 'MASTER', 'application/pdf'
      document_data.add_master_metadata_datastream
    end

    def self.do_get(uri)
      response = Net::HTTP.get_response(URI(uri))
      self.check_http_error response
      response.body
    end

    def self.check_http_error(response)
      error = false
      if (!response)
        error = "No response to POST"
      end
      if (response && response.code[0] != "2")
        error = "Unexpected response: #{response.code} #{response.message} #{response.body}"
      end
      if (error)
        raise error
      end
    end

    def self.config
      Rails.application.config_for(:vudl)
    end

    def self.generate_pdf(jpegurls)
      dir = '/tmp/'
      jpgs = jpegurls.map do |url|
        filename = "/tmp/#{SecureRandom.urlsafe_base64}.JPEG"
        #puts url
        image = self.do_get(url)
        File.open(filename, "w:ASCII-8BIT") do |f|
          f.write image.to_s
        end
        filename
      end
      image_list = Magick::ImageList.new(*jpgs)
      filename = "/tmp/#{SecureRandom.urlsafe_base64}.pdf"

      begin
        image_list.write(filename)
      rescue 
        system "convert #{jpgs.join ' '} #{filename}"
      end
      
      ocrmypdf = self.config['ocrmypdf_path'] 
      if (ocrmypdf)
        ocrmypdf_cmd = "#{ocrmypdf} #{filename} #{filename}"
        ocrmypdf_success = system ocrmypdf_cmd
        if (!ocrmypdf_success)
          raise "Problem running ocrmypdf"
        end
      end
      filename
    end
end
