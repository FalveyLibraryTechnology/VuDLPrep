require 'rmagick'

class Image
  include Magick

  attr_accessor :sizes

  def initialize(filename)
    @filename = filename
    @sizes = {
      "LARGE" => 3000,
      "MEDIUM" => 640,
      "THUMBNAIL" => 120
    }
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
      image = ImageList.new(@filename)
      image.resize_to_fit!(constraint_for_size(size))
      image.write(deriv)
    end
    deriv
  end

  def derivative_path(size)
    dir = File.dirname(@filename)
    filename = File.basename(@filename, '.*')
    "#{dir}/#{filename}/#{size}/#{filename}.jpg"
  end
end