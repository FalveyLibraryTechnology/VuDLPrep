class OcrGenerator
    @queue = :ingests

    def self.perform(pid)
      page = Fedora3Object.from_pid(pid)
      tiff_data = page.datastream_dissemination('MASTER')
      filename = "/tmp" + random_string
      image = Image.new(filename)
      File.open(filename, "w:ASCII-8BIT") do |f|
        f.write tiff_data.to_s
      end
      page.add_datastream_from_file image.ocr, 'OCR-DIRTY', 'text/plain'
      #File.delete(filename)
    end
  
    protected
    def random_string
      "#{SecureRandom.urlsafe_base64}.TIFF"
    end
end
