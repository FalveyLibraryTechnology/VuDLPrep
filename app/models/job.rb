class Job
  attr_reader :dir, :name

  def initialize(dir)
    @dir = dir
    @name = File.basename(dir)
  end

  def raw
    name
  end

  def metadata
    @metadata ||= JobMetadata.new self
  end
end