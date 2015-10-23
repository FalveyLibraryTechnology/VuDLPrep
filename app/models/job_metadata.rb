class JobMetadata
  def initialize(job)
    @job = job
    @filename = "#{job.dir}/job.json"
    if File.exist? @filename
      json = File.open(@filename) do |f|
        f.read
      end
      self.raw = JSON.parse(json)
    end
  end

  def raw
    {
      order: order.raw
    }
  end

  def raw=(data)
    @order = PageOrder.from_raw(data["order"])
  end

  def order
    @order ||= PageOrder.from_job(@job)
  end

  def save
    File.open(@filename, 'w') do |file|
      file.write raw.to_json
    end
  end
end