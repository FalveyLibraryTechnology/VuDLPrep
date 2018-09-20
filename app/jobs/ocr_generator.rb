class OcrGenerator
    @queue = :ingests

    def self.perform(dir)
      job = Job.new(dir)
      job.metadata.order.pages.each do |page|
        image = Image.new("#{job.dir}/#{page.filename}")
        image_data.add_datastream_from_file image.ocr, 'OCR-DIRTY', 'text/plain'
      end
    end
end