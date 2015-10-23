require 'rmagick'

class Image
  include Magick

  def initialize(filename)
    @filename = filename
  end

  def derivative(size, constraint)
    deriv = derivative_path(size)
    if !File.exist?(deriv)
      path = File.dirname(deriv)
      FileUtils.mkdir_p path unless File.exist?(path)
      image = ImageList.new(@filename)
      image.resize_to_fit!(constraint)
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