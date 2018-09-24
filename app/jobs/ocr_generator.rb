class OcrGenerator
    @queue = :ingests

    def self.perform(pid)
      page = Fedora3Object.from_pid(pid)
      tiff_data = page.datastream_dissemination('MASTER')
      image = Image.new('/tmp/file.TIFF', tiff_data)
      page.add_datastream_from_file image.ocr, 'OCR-DIRTY', 'text/plain'
    end
end