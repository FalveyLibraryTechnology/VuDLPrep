class Job
  attr_reader :dir, :name

  def initialize(dir)
    @dir = dir
    @name = File.basename(dir)
  end

  def json
    name
  end
end