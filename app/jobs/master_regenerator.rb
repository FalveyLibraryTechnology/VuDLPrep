class MasterRegenerator
    @queue = :ingests

    def self.perform(pid)
      page = Fedora3Object.from_pid(pid)
      jpg_data = page.datastream_dissemination('LARGE')
      filename = "/tmp/#{SecureRandom.urlsafe_base64}.JPG"
      File.open(filename, "w:ASCII-8BIT") do |f|
        f.write jpg_data.to_s
      end
      image = Image.new(filename)
      filenameTIFF = "/tmp/#{SecureRandom.urlsafe_base64}.TIFF"
      image.write(filenameTIFF)
      masterdata = page.datastream_dissemination('MASTER')
      unless masterdata
        page.add_datastream_from_file filenameTIFF, 'MASTER', 'image/tiff'
      end
      File.delete(filename)
      File.delete(filenameTIFF)
    end
end