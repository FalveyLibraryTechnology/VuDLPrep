require 'rmagick'
require 'fileutils'

class Job
  attr_reader :dir, :name

  def ingest
    lockfile = metadata.ingest_lockfile
    if (metadata.published && !File.exist?(lockfile))
      FileUtils.touch lockfile
      Resque.enqueue(Fedora3Ingestor, dir)
    end
  end

  def initialize(dir)
    @dir = dir
    @name = File.basename(dir)
  end

  def raw
    name
  end

  def make_derivatives
    status = metadata.derivative_status
    lockfile = metadata.derivative_lockfile
    if (status[:expected] > status[:processed] && !File.exist?(lockfile))
      FileUtils.touch lockfile
      Resque.enqueue(DerivativeGenerator, dir)
    end
  end

  def generate_pdf
    dir = @dir
    jpgs = metadata.order.pages.map do |page|
      image = Image.new(dir + "/" + page.filename)
      image.derivative("LARGE")
    end
    image_list = Magick::ImageList.new(*jpgs)
    filename = @dir + "/pages.pdf"
    image_list.write(filename)
    filename
  end

  def metadata
    @metadata ||= JobMetadata.new self
  end
end
