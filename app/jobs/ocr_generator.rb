class OcrGenerator
    @queue = :ingests

    def self.perform(pid)
      page = Fedora3Object.from_pid(pid)
      tiff_data = page.datastream_dissemination('MASTER')
      image = Image.new('/tmp/ocr-file.TIFF')
      File.open("/tmp/ocr-file.TIFF", "w:ASCII-8BIT") do |f|
        f.write tiff_data.to_s
      end
      page.add_datastream_from_file image.ocr, 'OCR-DIRTY', 'text/plain'
    end
end
