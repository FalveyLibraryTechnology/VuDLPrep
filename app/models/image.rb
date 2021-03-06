require 'rmagick'

class Image
  include Magick

  attr_accessor :sizes

  attr_reader :filename

  def initialize(filename)
    @filename = filename
    @sizes = {
      "LARGE" => 3000,
      "MEDIUM" => 640,
      "THUMBNAIL" => 120
    }
  end

  def config
    @config ||= Rails.application.config_for(:vudl)
  end

  def constraint_for_size(size)
    if @sizes.has_key?(size)
      @sizes[size]
    else
      1
    end
  end

  def derivative(size)
    deriv = derivative_path(size)
    if !File.exist?(deriv)
      path = File.dirname(deriv)
      FileUtils.mkdir_p path unless File.exist?(path)
      image = Image.read(@filename).first
      constraint = constraint_for_size(size)
      if (image.columns > constraint || image.rows > constraint)
        image.resize_to_fit!(constraint)
      end
      image.write(deriv)
    end
    deriv
  end

  def derivative_path(size, extension = 'jpg')
    dir = File.dirname(@filename)
    filename = File.basename(@filename, '.*')
    "#{dir}/#{filename}/#{size}/#{filename}.#{extension}"
  end

  def ocr
    txt = derivative_path('OCR-DIRTY', 'txt')
    if (!File.exist?(txt))
      txt_path = File.dirname(txt)
      FileUtils.mkdir_p txt_path unless File.exist?(txt_path)
      tesseract_cmd = "#{config['tesseract_path']} #{ocr_derivative} #{txt[0..-5]} #{ocr_properties}"
      tesseract_success = system tesseract_cmd
      if (!tesseract_success)
        raise "Problem running Tesseract command: #{tesseract_cmd}"
      end
      if (!File.exist?(txt))
        raise "Tesseract output file #{txt} does not exist; Tesseract command: #{tesseract_cmd}"
      end
    end
    txt
  end

  def ocr_derivative
      png = derivative_path('ocr/pngs', 'png')
      if (!File.exist?(png))
        png_path = File.dirname(png)
        FileUtils.mkdir_p png_path unless File.exist?(png_path)
        tc_cmd = "#{config['textcleaner_path']} #{config['textcleaner_switches']} #{derivative('LARGE')} #{png}"
        tc_success = system tc_cmd
        if (!tc_success || !File.exist?(png))
          raise "Problem running textcleaner"
        end
      end
      png
  end

  def ocr_properties
    file = File.dirname(@filename) + '/ocr/tesseract.config'
    if (!File.exist?(file))
      dir = File.dirname(file)
      FileUtils.mkdir_p dir unless File.exist?(dir)
      handle = File.new(file, 'w')
      handle.write('tessedit_char_whitelist ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:!\'"()&$%-+=[]?<>' + "\xE2\x80\x9C\xE2\x80\x9D\xE2\x80\x98\xE2\x80\x99")
      handle.close
    end
    file
  end

  def delete
    files = @sizes.map { |size,junk| derivative_path(size) }
    files << derivative_path('OCR-DIRTY', 'txt')
    files << derivative_path('ocr/pngs', 'png')
    files << @filename
    files.each do |file|
      if File.exist?(file)
        File.delete(file)
      end
    end
  end
end
