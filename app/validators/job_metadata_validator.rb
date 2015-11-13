class JobMetadataValidator
  def self.valid?(job, params)
    if !params[:order].is_a? Enumerable
      return false
    end
    self.order_valid?(job, params[:order])
  end

  def self.order_valid?(job, order)
    job.metadata.order = order
    problems = job.metadata.status[:file_problems]
    (problems[:deleted].empty? && problems[:added].empty?)
  end
end