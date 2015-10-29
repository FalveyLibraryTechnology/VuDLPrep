class DerivativeGenerator
  @queue = :derivatives

  def self.perform(dir)
    job = Job.new(dir)
    job.metadata.order.pages.each do |page|
      image = Image.new("#{job.dir}/#{page.filename}")
      image.sizes.keys.each do |key|
        image.derivative(key)
      end
    end
    if File.exist? job.metadata.derivative_lockfile
      File.delete job.metadata.derivative_lockfile
    end
  end
end
