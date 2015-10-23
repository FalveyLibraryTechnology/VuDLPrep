class Category
  attr_reader :dir, :name, :jobs

  def initialize(dir)
    @dir = dir
    @name = File.basename(dir)
    @jobs = []
    Dir.glob("#{dir}/*").sort.each do |job|
      if Dir.exist?(job)
        @jobs.push(Job.new job)
      end
    end
  end

  def json
    {
      category: name,
      jobs: jobs.map do |job|
        job.json
      end
    }
  end
end